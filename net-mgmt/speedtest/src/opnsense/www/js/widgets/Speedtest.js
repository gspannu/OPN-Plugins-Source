/*
 * Copyright (C) 2024 Tom Blyth nurse-wallow-2b@icloud.com
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES,
 * INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 * AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
 * OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

export default class Speedtest extends BaseTableWidget {
    constructor(config) {
        super(config);
        this.isWideLayout = false;
        this.currentData = null;
        this.configurable = true;
        this.serverId = null;
        this.lastTestTime = 0;
        this.isTestRunning = false;
        this.statusCheckInterval = null;
        this.mutex = false;
        
        // Clear any stale locks on initialization
        const LOCK_KEY = 'speedtest_running';
        sessionStorage.removeItem(LOCK_KEY);
    }

    // Lock management for concurrent test prevention
    async acquireLock() {
        if (this.mutex) return false;
        this.mutex = true;
        return true;
    }

    releaseLock() {
        this.mutex = false;
    }

    async getWidgetOptions() {
        return {
            metrics: {
                title: this.translations.metrics,
                type: 'select_multiple',
                options: [
                    { value: 'download', label: this.translations.download },
                    { value: 'upload', label: this.translations.upload },
                    { value: 'latency', label: this.translations.latency }
                ],
                default: ['download', 'upload', 'latency']
            }
        };
    }

    getMarkup() {
        let $speedtest_table = this.createTable('speedtest-table', {
            headerPosition: 'none'
        });
        
        // Add required styles for layout management
        $speedtest_table.append(`
            <style>
                .speedtest-wide {
                    display: flex;
                    justify-content: space-evenly;
                    width: 100%;
                    gap: 10px;
                }
                .speedtest-wide .metric-container {
                    flex: 1;
                }
                .speedtest-wide .text-muted {
                    display: block;
                }
                #run-speedtest:active {
                    font-weight: normal !important;
                }
            </style>
        `);
        
        return $('<div></div>').append($speedtest_table);
    }

    async onMarkupRendered() {
        try {
            // Set initial loading state
            this.updateServerListStatus('loading');

            // Initialize server connection
            const serverList = await this.ajaxCall('/api/speedtest/service/serverlist');
            
            if (serverList && serverList.error) {
                console.error('Server list error:', serverList.error);
                this.updateServerListStatus('error');
                return;
            }
            
            if (serverList && Array.isArray(serverList) && serverList.length > 0) {
                this.serverId = serverList[0].id;
                this.updateServerListStatus('success');

                // Load initial data
                const stats = await this.ajaxCall('/api/speedtest/service/showstat');
                const log = await this.ajaxCall('/api/speedtest/service/showlog');
                
                const data = {
                    ...stats,
                    latest: log[0]
                };
                
                this.currentData = data;
                this.updateLayout(data);
            } else {
                this.updateServerListStatus('empty');
            }
        } catch (error) {
            console.error('Initial widget data load failed:', error);
            this.updateServerListStatus('error');
        }
    }

    // Updates the server status message and button state
    updateServerListStatus(status) {
        const $lastTest = $('.speedtest-timestamp');
        let message = '';
        let isLink = true;

        switch(status) {
            case 'loading':
                message = `<i class="fa-solid fa-circle-notch fa-spin"></i><span style="margin-left: 5px;">${this.translations.retrievingServers}</span>`;
                isLink = false;
                break;
            case 'error':
                message = `<i class="fa-solid fa-triangle-exclamation"></i><span style="margin-left: 5px;">${this.translations.unableToRetrieveServers}</span>`;
                isLink = false;
                break;
            case 'empty':
                message = `<i class="fa-solid fa-triangle-exclamation"></i><span style="margin-left: 5px;">${this.translations.noServersAvailable}</span>`;
                isLink = false;
                break;
            default:
                return;
        }

        if (!isLink) {
            $lastTest.html(`<div class="text-center"><small>${message}</small></div>`);
            $('#run-speedtest').prop('disabled', true);
        }
    }

    formatTimestamp(isoString) {
        const date = new Date(isoString.replace(' ', 'T'));
        return date.toLocaleString();
    }

    async updateLayout(data) {
        const config = await this.getWidgetConfig();
        const enabledMetrics = Array.isArray(config.metrics) ? config.metrics : ['download', 'upload', 'latency'];

        let rows = [];
        const metricsData = [
            {
                id: 'download',
                icon: 'fa-download',
                value: parseFloat(data?.latest?.[5]),
                avg: data?.download?.avg,
                min: data?.download?.min,
                max: data?.download?.max,
                unit: 'Mbps'
            },
            {
                id: 'upload',
                icon: 'fa-upload',
                value: parseFloat(data?.latest?.[6]),
                avg: data?.upload?.avg,
                min: data?.upload?.min,
                max: data?.upload?.max,
                unit: 'Mbps'
            },
            {
                id: 'latency',
                icon: 'fa-stopwatch',
                value: parseFloat(data?.latest?.[7]),
                avg: data?.latency?.avg,
                min: data?.latency?.min,
                max: data?.latency?.max,
                unit: 'ms'
            }
        ].filter(metric => enabledMetrics.includes(metric.id));

        // Wide layout for larger screens
        if (this.isWideLayout) {
            rows.push([
                $(`
                    <div class="speedtest-wide">
                        ${metricsData.map(metric => `
                            <div class="metric-container">
                                <a href="/ui/speedtest/#" style="text-decoration: none; color: inherit; display: block; text-align: center;">
                                    <b>${this.translations[metric.id]}</b>
                                    <div style="margin: 5px 0">
                                        <i class="fa-solid ${metric.icon} text-primary"></i>
                                        <span style="margin-left: 10px;">
                                            ${metric.value ? metric.value.toFixed(2) : this.translations.noData} ${metric.unit}
                                        </span>
                                    </div>
                                    <small class="text-muted">${this.translations.max}: ${metric.max.toFixed(2)} ${metric.unit}</small>
                                    <small class="text-muted">${this.translations.avg}: ${metric.avg.toFixed(2)} ${metric.unit}</small>
                                    <small class="text-muted">${this.translations.min}: ${metric.min.toFixed(2)} ${metric.unit}</small>
                                </a>
                            </div>
                        `).join('')}
                    </div>
                `).prop('outerHTML')
            ]);
        } else {
            // Compact layout for smaller screens
            metricsData.forEach(metric => {
                rows.push([
                    $(`
                        <a href="/ui/speedtest/#" style="text-decoration: none; color: inherit;">
                            <div>
                                <b>${this.translations[metric.id]}</b>
                                <div style="margin: 5px 0">
                                    <i class="fa-solid ${metric.icon} text-primary"></i>
                                    <span style="margin-left: 10px;">
                                        ${metric.value ? metric.value.toFixed(2) : this.translations.noData} ${metric.unit}
                                    </span>
                                </div>
                                <small class="text-muted">${this.translations.max}: ${metric.max.toFixed(2)} ${metric.unit}</small>
                                <br/>
                                <small class="text-muted">${this.translations.avg}: ${metric.avg.toFixed(2)} ${metric.unit}</small>
                                <br/>
                                <small class="text-muted">${this.translations.min}: ${metric.min.toFixed(2)} ${metric.unit}</small>
                            </div>
                        </a>
                    `).prop('outerHTML')
                ]);
            });
        }

        // Add timestamp if available
        if (data?.period?.youngest) {
            rows.push([
                $(`
                    <div class="text-center speedtest-timestamp">
                        <a href="${data.latest[8]}" target="_blank" class="text-muted" style="display: block; text-decoration: none;">
                            <small>
                                <span class="last-test-label">${this.translations.lastTest}: </span>
                                <span class="last-test-time">${this.formatTimestamp(data.period.youngest)}</span>
                            </small>
                        </a>
                    </div>
                `).prop('outerHTML')
            ]);
        }

        // Add speedtest button
        rows.push([
            $(`
                <div class="text-center">
                    <button class="btn btn-primary btn-xs" id="run-speedtest" ${!this.serverId ? 'disabled' : ''}>
                        <i class="fa-solid fa-arrow-rotate-right"></i>
                        <span style="margin-left: 2px;">${this.translations.runSpeedtest}</span>
                    </button>
                </div>
            `).prop('outerHTML')
        ]);

        this.updateTable('speedtest-table', rows);
        this.attachEventHandlers();
        this.checkLastTestWrapping();
    }

    async onWidgetOptionsChanged(options) {
        if (this.currentData) {
            this.updateLayout(this.currentData);
        }
    }

    // Checks if the timestamp text needs to be truncated for smaller screens
    checkLastTestWrapping() {
        const container = document.querySelector('.speedtest-timestamp');
        if (!container) return;

        const label = container.querySelector('.last-test-label');
        const time = container.querySelector('.last-test-time');
        if (!label || !time) return;

        const containerWidth = container.offsetWidth;
        const tempSpan = document.createElement('span');
        tempSpan.style.visibility = 'hidden';
        tempSpan.style.position = 'absolute';
        tempSpan.style.whiteSpace = 'nowrap';
        tempSpan.innerHTML = label.innerHTML + time.innerHTML;
        document.body.appendChild(tempSpan);

        const fullWidth = tempSpan.offsetWidth;
        document.body.removeChild(tempSpan);

        label.style.display = fullWidth > containerWidth ? 'none' : 'inline';
    }

    // Handles speedtest execution and monitoring
    attachEventHandlers() {
        const cooldownPeriod = 60000;  // 1 minute cooldown
        const LOCK_KEY = 'speedtest_running';
        
        // Clear stale locks that are older than 5 minutes
        const existingLock = sessionStorage.getItem(LOCK_KEY);
        if (existingLock) {
            const lockTime = parseInt(existingLock);
            if (Date.now() - lockTime > 300000) {
                console.log('Clearing stale lock');
                sessionStorage.removeItem(LOCK_KEY);
            }
        }

        const $btn = $('#run-speedtest');
        $btn.off('click').on('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            if (sessionStorage.getItem(LOCK_KEY)) {
                console.log('Global lock active - test in progress');
                return false;
            }
            
            if (!await this.acquireLock()) {
                console.log('Instance lock failed - test already in progress');
                return false;
            }

            const now = Date.now();
            if (now - this.lastTestTime < cooldownPeriod) {
                console.log('Within cooldown period, blocking execution');
                this.releaseLock();
                return false;
            }

            if (!this.serverId || $btn.prop('disabled')) {
                this.releaseLock();
                return false;
            }

            const $icon = $btn.find('i');
            
            try {
                sessionStorage.setItem(LOCK_KEY, Date.now().toString());
                $btn.prop('disabled', true);
                $icon.addClass('fa-spin');

                const initialState = await this.getLatestTestTime();
                console.log('Starting speedtest execution with global lock');

                // Execute speedtest
                await new Promise((resolve, reject) => {
                    $.ajax({
                        url: '/api/speedtest/service/run',
                        method: 'POST',
                        data: { serverid: this.serverId },
                        timeout: 5000,
                        success: resolve,
                        error: (jqXHR, textStatus) => {
                            textStatus === 'timeout' ? resolve() : reject(new Error(textStatus));
                        }
                    });
                });

                // Monitor for completion
                let monitoringStart = Date.now();
                while (Date.now() - monitoringStart < 300000) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    
                    const currentState = await this.getLatestTestTime();
                    if (currentState > initialState) {
                        await this.onWidgetTick();
                        break;
                    }
                }

            } catch (error) {
                console.error('Test execution error:', error);
                this.showError(this.translations.unknownError);
            } finally {
                console.log('Resetting test state and releasing lock');
                $btn.prop('disabled', false);
                $icon.removeClass('fa-spin');
                sessionStorage.removeItem(LOCK_KEY);
                this.releaseLock();
            }

            return false;
        });
    }

    // Retrieves the timestamp of the latest test
    async getLatestTestTime() {
        try {
            const log = await this.ajaxCall('/api/speedtest/service/showlog');
            if (log && log[0] && log[0][0]) {
                return new Date(log[0][0]).getTime();
            }
        } catch (error) {
            console.error('Error getting latest test time:', error);
        }
        return Date.now();
    }

    // Displays error messages in the widget
    showError(message) {
        const $lastTest = $('.speedtest-timestamp');
        const $errorMsg = $(`
            <div class="text-center" style="display: block;">
                <small>
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <span style="margin-left: 5px;">${message}</span>
                </small>
            </div>
        `);

        $lastTest.fadeOut(400, () => {
            $errorMsg.hide().insertAfter($lastTest).fadeIn(400);
            setTimeout(() => {
                $errorMsg.fadeOut(400, () => {
                    $lastTest.fadeIn(400);
                    $errorMsg.remove();
                });
            }, 5000);
        });
    }

    // Handles speedtest errors with specific messages
    handleSpeedtestError(error) {
        if (error.responseText) {
            try {
                const response = JSON.parse(error.responseText);
                if (response.error || response.message === "No speedtest package installed") {
                    let errorMessage = this.translations.unknownError;
                    if (response.error) {
                        if (response.error.includes("not recognized")) {
                            errorMessage = this.translations.serverNotFound;
                        } else if (response.error.includes("invalid server id")) {
                            errorMessage = this.translations.invalidServer;
                        }
                    } else if (response.message === "No speedtest package installed") {
                        errorMessage = this.translations.packageNotInstalled;
                    }
                    
                    this.showError(errorMessage);
                }
            } catch (e) {
                console.error('Error parsing error response:', e);
                this.showError(this.translations.unknownError);
            }
        }
    }

    // Updates widget data on timer tick
    async onWidgetTick() {
        try {
            const stats = await this.ajaxCall('/api/speedtest/service/showstat');
            const log = await this.ajaxCall('/api/speedtest/service/showlog');
            
            const data = {
                ...stats,
                latest: log[0]
            };
            
            if (!this.dataChanged('speedtest', data)) {
                return;
            }

            this.currentData = data;
            this.updateLayout(data);
        } catch (error) {
            console.error('Widget update failed:', error);
        }
    }

    // Handles widget resize events
    onWidgetResize(elem, width, height) {
        const wasWideLayout = this.isWideLayout;
        this.isWideLayout = width >= 400;
        
        if (wasWideLayout !== this.isWideLayout && this.currentData) {
            this.updateLayout(this.currentData);
        } else {
            this.checkLastTestWrapping();
        }
        
        return super.onWidgetResize(elem, width, height);
    }
}