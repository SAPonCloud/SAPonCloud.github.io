sap.ui.define(
	[
		"sap/ui/core/mvc/Controller",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/ui/model/Sorter",
		"sap/m/MessageBox",
	],
	function (Controller, Filter, FilterOperator, Sorter, MessageBox) {
		"use strict";

		return Controller.extend("zlhsl.controller.Function", {
			onInit: function () {
				this._bDescendingSort = false;
				this.oRouter = this.getOwnerComponent().getRouter();
			},

			onSearch: function (oEvent) {
				var oTableSearchState = [],
					sQuery = oEvent.getParameter("query");

				if (sQuery && sQuery.length > 0) {
					oTableSearchState = [
						new Filter("FunctionText", FilterOperator.Contains, sQuery) ||
						new Filter("FunctionID", FilterOperator.Contains, sQuery),
					];
				}

				this.getView()
					.byId("functionsTable")
					.getBinding("items")
					.filter(oTableSearchState, "Application");
			},

			onSort: function () {
				//Toggle the sorting
				this._bDescendingSort = !this._bDescendingSort;
				var oView = this.getView(),
					oTable = oView.byId("functionsTable"),
					oBinding = oTable.getBinding("items"),
					oSorter = new Sorter("FunctionID", this._bDescendingSort);

				oBinding.sort(oSorter);
			},

			onAdd: function (oEvent) {
				MessageBox.show("This functionality is not ready yet.", {
					icon: MessageBox.Icon.INFORMATION,
					title: "Aw, Snap!",
					actions: [MessageBox.Action.OK],
				});
			},

			onListItemPress: function (oEvent) {
				// var functionPath = oEvent.getSource().getBindingContext().getPath(),
				// 	functionid = functionPath.split("/").slice(-1).pop(),
				var functionid = oEvent.getSource().getBindingContext().getProperty("FunctionID"),
					oNextUIState;
				this.getOwnerComponent().getHelper().then(function (oHelper) {
					oNextUIState = oHelper.getNextUIState(1);
					this.oRouter.navTo("detail", { layout: oNextUIState.layout, functionid: functionid });
				}.bind(this));
			},

			onUpdateFinished: function (oEvent) {
				var scount = oEvent.getParameter("total");
				var oTitle = this.getView().byId("entityTitle");
				oTitle.setProperty(
					"text",
					this.getOwnerComponent()
						.getModel("i18n")
						.getResourceBundle()
						.getText("title.text.Functions") +
					" (" +
					scount +
					")"
				);
			},
		});
	}
);
