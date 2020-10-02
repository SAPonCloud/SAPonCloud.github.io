sap.ui.define([
	"sap/ui/core/util/MockServer",
	"sap/base/util/UriParameters"
], function (MockServer, UriParameters) {
	"use strict";

	return {
		init: function () {
			// create
			var oMockServer = new MockServer({
				rootUri: "/sap/opu/odata/SAP/ZLHSL_TIMCONFIG_SRV/"
				//This is path of OData in ABAP system
			});

			var oUriParameters = new UriParameters(window.location.href);

			// configure mock server with a delay
			MockServer.config({
				autoRespond: true,
				autoRespondAfter: oUriParameters.get("serverDelay") || 500
			});

			// simulate
			var sPath = "../localService";
			oMockServer.simulate(sPath + "/metadata.xml");
			//This is going to mock the rootUri i.e. Odata with a local metadata.xml

			// start
			oMockServer.start();
		}
	};

});