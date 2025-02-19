{#
 # Copyright (C) 2024 Guru Pannu <opnsense@gurupannu.com>
 # All rights reserved.
 #}

<div class="content-box" style="padding-bottom: 1.5em;">
    {{ partial("layout_partials/base_form",['fields':generalForm,'id':'frm_general_settings'])}}
    <div class="col-md-12">
        <hr />
        <button class="btn btn-primary" id="saveAct" type="button"><b>{{ lang._('Save') }}</b> <i id="saveAct_progress"></i></button>
    </div>
</div>

<script>
    $(function() {
        var data_get_map = {'frm_general_settings':"/api/ctrld/general/get"};
        mapDataToFormUI(data_get_map).done(function(data){
            formatTokenizersUI();
            $('.selectpicker').selectpicker('refresh');
        });

    updateServiceControlUI('ctrld');

        $("#saveAct").click(function(){
            saveFormToEndpoint(url="/api/ctrld/general/set", formid='frm_general_settings',callback_ok=function(){
            $("#saveAct_progress").addClass("fa fa-spinner fa-pulse");
                ajaxCall(url="/api/ctrld/service/reconfigure", sendData={}, callback=function(data,status) {
                    updateServiceControlUI('ctrld');
                    $("#saveAct_progress").removeClass("fa fa-spinner fa-pulse");
                });
            });
        });

    });
</script>
