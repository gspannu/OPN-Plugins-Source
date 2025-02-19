<?php

/*
 * Copyright (C) 2024 Guru Pannu <opnsense@gurupannu.com>
 * All rights reserved.
 */

namespace OPNsense\nextdns\Api;

use OPNsense\Base\ApiMutableServiceControllerBase;

class ServiceController extends ApiMutableServiceControllerBase
{
    protected static $internalServiceClass = '\OPNsense\nextdns\General';
    protected static $internalServiceTemplate = 'OPNsense/nextdns';
    protected static $internalServiceEnabled = 'enabled';
    protected static $internalServiceName = 'nextdns';
}
