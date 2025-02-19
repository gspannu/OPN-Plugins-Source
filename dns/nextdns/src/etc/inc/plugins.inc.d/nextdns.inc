<?php

/*
 * Copyright (C) 2024 Guru Pannu <opnsense@gurupannu.com>
 * All rights reserved.
 *
 */

function nextdns_services()
{
    global $config;

    $services = array();

    if (isset($config['OPNsense']['nextdns']['general']['enabled']) && $config['OPNsense']['nextdns']['general']['enabled'] == 1  && $config['OPNsense']['nextdns']['general']['primarydns'] == 1) {
        $services[] = array(
            'dns_ports' => ['53'],
            'description' => gettext('NextDNS DNS'),
            'configd' => array(
                'restart' => array('nextdns restart'),
                'start' => array('nextdns start'),
                'stop' => array('nextdns stop'),
            ),
            'name' => 'nextdns',
            'pidfile' => '/var/run/nextdns.pid',
        );
    }
    elseif (isset($config['OPNsense']['nextdns']['general']['enabled']) && $config['OPNsense']['nextdns']['general']['enabled'] == 1  && $config['OPNsense']['nextdns']['general']['primarydns'] == 0) {
        $services[] = array(
            'description' => gettext('NextDNS DNS'),
            'configd' => array(
                'restart' => array('nextdns restart'),
                'start' => array('nextdns start'),
                'stop' => array('nextdns stop'),
            ),
            'name' => 'nextdns',
            'pidfile' => '/var/run/nextdns.pid',
        );
    }  

    return $services;
}
