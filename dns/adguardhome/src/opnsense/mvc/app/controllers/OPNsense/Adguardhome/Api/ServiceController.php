<?php

/*
 * Copyright (C) 2025 Guru Pannu <opnsense@gurupannu.com>
 * All rights reserved.
 */

namespace OPNsense\Adguardhome\Api;

use OPNsense\Base\ApiMutableServiceControllerBase;

class ServiceController extends ApiMutableServiceControllerBase
{
    protected static $internalServiceClass = '\OPNsense\Adguardhome\General';
    protected static $internalServiceTemplate = 'OPNsense/Adguardhome';
    protected static $internalServiceEnabled = 'enabled';
    protected static $internalServiceName = 'adguardhome';
}
