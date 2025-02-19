<?php

/*
 * Copyright (C) 2024 Guru Pannu <opnsense@gurupannu.com>
 * All rights reserved.
 *
 */

function ctrld_services()
{
    global $config;

    $services = array();

    if (isset($config['OPNsense']['ctrld']['general']['enabled']) && $config['OPNsense']['ctrld']['general']['enabled'] == 1  && $config['OPNsense']['ctrld']['general']['primarydns'] == 1) {
        $services[] = array(
            'dns_ports' => ['53'],
            'description' => gettext('ControlD DNS'),
            'configd' => array(
                'restart' => array('ctrld restart'),
                'start' => array('ctrld start'),
                'stop' => array('ctrld stop'),
            ),
            'name' => 'ctrld',
            'pidfile' => '/var/run/ctrld.pid',
        );
    }
    elseif (isset($config['OPNsense']['ctrld']['general']['enabled']) && $config['OPNsense']['ctrld']['general']['enabled'] == 1  && $config['OPNsense']['ctrld']['general']['primarydns'] == 0) {
        $services[] = array(
            'description' => gettext('ControlD DNS'),
            'configd' => array(
                'restart' => array('ctrld restart'),
                'start' => array('ctrld start'),
                'stop' => array('ctrld stop'),
            ),
            'name' => 'ctrld',
            'pidfile' => '/var/run/ctrld.pid',
        );
    }  

    return $services;
}
