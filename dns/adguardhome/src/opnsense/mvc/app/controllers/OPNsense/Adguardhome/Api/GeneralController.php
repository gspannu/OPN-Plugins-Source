<?php

/*
 * Copyright (C) 2025 Guru Pannu <opnsense@gurupannu.com>
 * All rights reserved.
 */

namespace OPNsense\Adguardhome\Api;

use OPNsense\Base\ApiMutableModelControllerBase;

class GeneralController extends ApiMutableModelControllerBase
{
    protected static $internalModelClass = '\OPNsense\Adguardhome\General';
    protected static $internalModelName = 'general';
}
