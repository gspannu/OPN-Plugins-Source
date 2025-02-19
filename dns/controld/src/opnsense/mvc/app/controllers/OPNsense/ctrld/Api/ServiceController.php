<?php

/*
 * Copyright (C) 2024 Guru Pannu <opnsense@gurupannu.com>
 * All rights reserved.
 */

namespace OPNsense\ctrld\Api;

use OPNsense\Base\ApiMutableServiceControllerBase;

class ServiceController extends ApiMutableServiceControllerBase
{
    protected static $internalServiceClass = '\OPNsense\ctrld\General';
    protected static $internalServiceTemplate = 'OPNsense/ctrld';
    protected static $internalServiceEnabled = 'enabled';
    protected static $internalServiceName = 'ctrld';
}
