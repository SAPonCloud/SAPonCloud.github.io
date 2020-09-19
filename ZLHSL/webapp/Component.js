sap.ui.define(
	[
		"sap/base/util/UriParameters",
		"sap/ui/core/UIComponent",
		"sap/ui/model/json/JSONModel",
		"sap/f/FlexibleColumnLayoutSemanticHelper",
		"sap/ui/Device",
		"sap/f/library"
	],
	function (
		UriParameters,
		UIComponent,
		JSONModel,
		FlexibleColumnLayoutSemanticHelper,
		Device,
		library
	) {
		"use strict";

		var LayoutType = library.LayoutType;

		return UIComponent.extend("zlhsl.Component", {
			metadata: {
				manifest: "json",
			},

			init: function () {
				var oModel = new JSONModel();
				this.setModel(oModel, "layout");

				UIComponent.prototype.init.apply(this, arguments);
				this.getRouter().initialize();
			},

			getHelper: function () {
				// var oFCL = this.getRootControl().byId("flexibleColumnLayout"),
				// 	oParams = UriParameters.fromQuery(location.search),
				// 	oSettings = {
				// 		defaultTwoColumnLayoutType: LayoutType.TwoColumnsMidExpanded,
				// 		defaultThreeColumnLayoutType: LayoutType.ThreeColumnsEndExpanded,
				// 		mode: oParams.get("mode"),
				// 		maxColumnsCount: oParams.get("max")
				// 	};
				// return FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFCL, oSettings);
				return this._getFcl().then(function (oFCL) {
					// var oParams = UriParameters.fromQuery(location.search),
					var oSettings = {
						defaultTwoColumnLayoutType: LayoutType.TwoColumnsMidExpanded,
						defaultThreeColumnLayoutType: LayoutType.ThreeColumnsEndExpanded,
						initialColumnsCount: 2,		//oParams.get("mode"),
						maxColumnsCount: 3			//oParams.get("max"),
					};

					return FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFCL, oSettings);
				});
			},

			_getFcl: function () {
				return new Promise(
					function (resolve, reject) {
						var oFCL = this.getRootControl().byId("flexibleColumnLayout");
						if (!oFCL) {
							this.getRootControl().attachAfterInit(function (oEvent) {
								resolve(oEvent.getSource().byId("flexibleColumnLayout"));
							}, this);
							return;
						}
						resolve(oFCL);
					}.bind(this)
				);
			},

			getContentDensityClass: function () {
				if (!this._sContentDensityClass) {
					if (!Device.support.touch) {
						this._sContentDensityClass = "sapUiSizeCompact";
					} else {
						this._sContentDensityClass = "sapUiSizeCozy";
					}
				}
				return this._sContentDensityClass;
			},
		});
	}
);