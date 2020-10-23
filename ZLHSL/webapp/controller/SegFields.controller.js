sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "zlhslc/model/formatter",
    "sap/ui/core/Fragment"
], function (Controller, Filter, FilterOperator, Sorter, MessageBox, MessageToast, formatter, Fragment) {
    'use strict';

    return Controller.extend("zlhslc.controller.SegFields", {

        formatter: formatter,

        onInit: function () {
            var oExitButton = this.getView().byId("exitFullScreenBtn"),
                oEnterButton = this.getView().byId("enterFullScreenBtn");

            this.oRouter = this.getOwnerComponent().getRouter();
            this.oModel = this.getOwnerComponent().getModel("layout");

            this.oRouter.getRoute("detail").attachPatternMatched(this._onInterfaceMatched, this);
            this.oRouter.getRoute("detailDetail").attachPatternMatched(this._onInterfaceMatched, this);

            this._idocsegment = null;
            this._fields = null;

            [oExitButton, oEnterButton].forEach(function (oButton) {
                oButton.addEventDelegate({
                    onAfterRendering: function () {
                        if (this.bFocusFullScreenButton) {
                            this.bFocusFullScreenButton = false;
                            oButton.focus();
                        }
                    }.bind(this)
                });
            }, this);
        },

        _onInterfaceMatched: function (oEvent) {
            // var oModel = this.getOwnerComponent().getModel();
            this._functionid = oEvent.getParameter("arguments").functionid || this._functionid;
            this._interfaceid = oEvent.getParameter("arguments").interfaceid || this._interfaceid;

            // this.getView().bindElement(
            //     "/InterfaceSet(FunctionID='" + this._functionid + "',InterfaceID='" + this._interfaceid + "')", {
            //         expand: "ToSegments"
            //     });
            var oSegmentSmartForm = this.byId("idSegmentSmartForm");
            var oFieldSmartForm = this.byId("idFieldSmartForm");

            // if (this._functionid !== this._functionidtmp || this._interfaceid !== this._interfaceidtmp) {

            //     if (oSegmentSmartForm.getEditable()) {
            //         if (this._bSegCreateMode) {
            //             oSegmentSmartForm.getModel().deleteCreatedEntry(oSegmentSmartForm.getBindingContext());
            //             oSegmentSmartForm.setBindingContext(null);
            //             this._bSegCreateMode = false;
            //         }
            //         oSegmentSmartForm.getModel().resetChanges();
            //         MessageToast.show("Segment editing was cancelled.");
            //         oSegmentSmartForm.setVisible(false);
            //         oSegmentSmartForm.setEditable(false);
            //     }

            //     if (oFieldSmartForm.getEditable()) {
            //         if (this._bFieldCreateMode) {
            //             oFieldSmartForm.getModel().deleteCreatedEntry(oFieldSmartForm.getBindingContext());
            //             oFieldSmartForm.setBindingContext(null);
            //             this._bFieldCreateMode = false;
            //         }
            //         oFieldSmartForm.getModel().resetChanges();
            //         MessageToast.show("Field editing was cancelled.");
            //         oFieldSmartForm.setVisible(false);
            //         oFieldSmartForm.setEditable(false);
            //     }
            // }

            this.getView().bindElement("/InterfaceSet(FunctionID='" + this._functionid + "',InterfaceID='" + this._interfaceid + "')", {
                expand: "ToSegments,ToFields"
            });

            oSegmentSmartForm.bindElement("/InterfaceSet(FunctionID='" + this._functionid + "',InterfaceID='" + this._interfaceid + "')/ToSegments");

            oFieldSmartForm.bindElement("/InterfaceSet(FunctionID='" + this._functionid + "',InterfaceID='" + this._interfaceid + "')/ToFields");

            this._functionidtmp = this._functionid;
            this._interfaceidtmp = this._interfaceid;
        },

        onCreateField: function (oEvent) {
            if (this._checkCreateMode()) {
                return;
            }

            this.getView().byId("idScrollContainerField").setProperty("height", this._getHeight(this._fieldCount, true));

            this._bFieldCreateMode = true;
            this._fields = null;

            var oSmartFormField = this.byId("idFieldSmartForm"),
                oDataModel = this.getView().getModel();
            oSmartFormField.unbindContext();
            oSmartFormField.getModel().setDefaultBindingMode("TwoWay");
            oSmartFormField.setBindingContext(oDataModel.createEntry("/FieldSet", {
                refreshAfterChange: true,
                properties: {
                    FunctionID: this._functionid,
                    InterfaceID: this._interfaceid
                },
                success: function () {
                    this._bFieldCreateMode = null;
                    MessageToast.show("Field created successfully.");
                    oSmartFormField.setProperty("title", "Change Field");
                    this.getView().setBusy(false);
                }.bind(this),
                error: function () {
                    MessageBox.error("Field could not be created.");
                    this.getView().setBusy(false);
                    this._bFieldCreateMode = null;
                }.bind(this)
            }));

            this.byId("idFieldPanel").setVisible(true);
            oSmartFormField.setVisible(true);
            oSmartFormField.setEditable(true);
            oSmartFormField.setEditTogglable(false);
            oSmartFormField.setProperty("title", "Create Field");
            this.scrollToElement(oSmartFormField, "idFieldSmartForm");
        },

        onSelectField: function (oEvent) {
            this._sPath = oEvent.getSource().getBindingContextPath();
            var bChanged = false;
            if (this._fields !== null && this.byId("idFieldSmartForm").getEditable()) {
                if (this._fields.Segment === oEvent.getSource().getBindingContext().getProperty("Segment") && this._fields.FieldName === oEvent.getSource().getBindingContext().getProperty("FieldName")) {
                    MessageToast.show("Field '" + this._fields.FieldName + "' is already being edited.");
                    return;
                }
                bChanged = this._checkFieldDataChanged(this._fnCheckOnSwitchField);
            }
            if (!bChanged) {
                this.showFieldDetails(this._sPath, false);
                delete this._sPath;
            } else {
                this._bEditable = false;
            }
        },

        onEditField: function (oEvent) {
            this._sPath = oEvent.getSource().getBindingContext().getPath();
            var bChanged = false;
            if (this._fields !== null && this.byId("idFieldSmartForm").getEditable()) {
                if (this._fields.Segment === oEvent.getSource().getBindingContext().getProperty("Segment") && this._fields.FieldName === oEvent.getSource().getBindingContext().getProperty("FieldName")) {
                    MessageToast.show("Field '" + this._fields.FieldName + "' is already being edited.");
                    return;
                }
                bChanged = this._checkFieldDataChanged(this._fnCheckOnSwitchField);
            }
            if (!bChanged) {
                this.showFieldDetails(this._sPath, true);
                delete this._sPath;
            } else {
                this._bEditable = true;
            }
        },

        showFieldDetails: function (sPath, bEditable) {
            this.getView().byId("idScrollContainerField").setProperty("height", this._getHeight(this._fieldCount, true));

            this.getView().byId("idFieldPanel").setVisible(true);
            // var segmentName = oEvent.getSource().getCells()[0].getProperty("title"),
            //     fieldName = oEvent.getSource().getCells()[1].getProperty("title"),
            //     counter = oEvent.getSource().getCells()[2].getProperty("title"),
            //     sPath = "/FieldSet(FunctionID='" + this._functionid + "',InterfaceID='" + this._interfaceid + "',Segment='" + segmentName + "',FieldName='" + fieldName + "',Counter='" + counter + "')";

            var oSmartForm = this.getView().byId("idFieldSmartForm");

            oSmartForm.setVisible(true);
            oSmartForm.setEditTogglable(true);
            oSmartForm.setEditable(bEditable);

            if (oSmartForm.getProperty("editable")) {
                oSmartForm.setProperty("title", "Change Segment Field");
            } else {
                oSmartForm.setProperty("title", "Segment Field");
            }
            oSmartForm.bindElement(sPath);
            oSmartForm.getModel().setDefaultBindingMode("TwoWay");

            /* Get selected Interface entity*/
            this._fields = this.getView().getModel().getData(sPath);

            this.scrollToElement(oSmartForm, "idFieldSmartForm");
        },

        onEditToggledField: function (oEvent) {
            this._bFieldEditable = oEvent.getParameter("editable");

            if (this._bSegEditable) {
                MessageToast.show("A segment is being edited. Please save or cancel the changes first.");
                this.getView().byId("idFieldSmartForm").setEditable(false);
            }

            if (this._fields !== null && this._bFieldEditable === false) {
                this._checkFieldDataChanged(this._fnCheckOnEditToggledField);
            }

            if (this._bFieldEditable) {
                this.getView().byId("idFieldSmartForm").setProperty("title", "Change Field");
                this.bFieldEditable = true;

            } else {
                this.getView().byId("idFieldSmartForm").setProperty("title", "IDoc Field");
                this.bFieldEditable = false;
            }

            this.toggleFooter();
        },

        onDeleteField: function (oEvent) {
            this._segment = oEvent.getSource().getParent().getParent().getAggregation("cells")[0].getProperty("title");
            this._field = oEvent.getSource().getParent().getParent().getAggregation("cells")[1].getProperty("title");
            this._sPath = oEvent.getSource().getParent().getParent().getBindingContextPath();
            MessageBox.confirm("It will delete Field '" +
                this._field +
                "' from segment '" + this._segment + "' permanently. Proceed?",
                function (oAction) {
                    if (oAction === 'OK') {
                        this.getView().setBusy(true);
                        this.getView().byId("idFieldSmartForm").setVisible(false);
                        this.getView().getModel().remove(this._sPath, {
                            refreshAfterChange: true,
                            success: function () {
                                this.getView().setBusy(false);
                                MessageToast.show("Field '" + this._field + "' deleted from Segment '" + this._segment + "' succcessfully.");
                            }.bind(this),
                            error: function () {
                                this.getView().setBusy(false);
                                MessageToast.show("Error occured while deleting Field '" + this._field + "' from Segment '" + this._segment + "'");
                            }.bind(this)
                        });
                        this.getView().byId("idFieldSmartForm").setEditable(false);
                        this.byId("idFieldPanel").setVisible(false);
                    } else {
                        MessageToast.show("Deletion cancelled.");
                    }
                }.bind(this)
            );
        },

        onCloneField: function (oEvent) {
            if (this._checkCreateMode()) {
                return;
            }

            this.getView().byId("idScrollContainerField").setProperty("height", this._getHeight(this._fieldCount, true));
            this._bFieldCreateMode = true;
            this._fields = null;

            var oSmartFormField = this.byId("idFieldSmartForm"),
                oDataModel = this.getView().getModel(),
                sPath = oEvent.getSource().getParent().getParent().getBindingContextPath(),
                oData = oDataModel.getData(sPath);

            delete oData.__metadata;
            oData.Segment = oData.Segment + "_COPY";
            oData.FieldName = oData.FieldName + "_COPY";

            oSmartFormField.unbindContext();
            oSmartFormField.getModel().setDefaultBindingMode("TwoWay");
            oSmartFormField.setBindingContext(oDataModel.createEntry("/FieldSet", {
                refreshAfterChange: true,
                properties: oData,
                success: function () {
                    this._bFieldCreateMode = null;
                    MessageToast.show("Field copied successfully.");
                    oSmartFormField.setProperty("title", "Change Field");
                    this.getView().setBusy(false);
                }.bind(this),
                error: function () {
                    MessageBox.error("Field could not be copied.");
                    this.getView().setBusy(false);
                    this._bFieldCreateMode = null;
                }.bind(this)
            }));

            this.byId("idFieldPanel").setVisible(true);
            oSmartFormField.setVisible(true);
            oSmartFormField.setEditable(true);
            oSmartFormField.setEditTogglable(false);
            oSmartFormField.setProperty("title", "Copy Field");
            this.scrollToElement(oSmartFormField, "idFieldSmartForm");
        },

        _checkFieldDataChanged: function (fnName) {
            if (this._fields !==
                this.getView().byId("idFieldSmartForm").getModel().getData(
                    this.getView().byId("idFieldSmartForm").getBindingContext().getPath())) {
                MessageBox.confirm("Field details have changed. Discard Changes?",
                    fnName.bind(this));
                return true;
            } else {
                return false;
            }
        },

        _fnCheckOnSwitchField: function (oAction) {
            if (oAction === 'OK') {
                this.getView().byId("idFieldSmartForm").getModel().resetChanges();
                this.showFieldDetails(this._sPath, this._bEditable);
            }
            delete this._sPath;
            delete this._bEditable;
        },

        _fnCheckOnEditToggledField: function (oAction) {
            if (oAction === 'OK') {
                this.getView().byId("idFieldSmartForm").getModel().resetChanges();
            } else {
                this.getView().byId("idFieldSmartForm").setEditable(true);
            };
        },

        onSearchFields: function (oEvent) {
            var oTableSearchState = [],
                sQuery = oEvent.getParameter("query");

            if (sQuery && sQuery.length > 0) {
                oTableSearchState = [
                    new Filter("Segment", FilterOperator.Contains, sQuery),
                    new Filter("FieldName", FilterOperator.Contains, sQuery),
                ];

                this.getView()
                    .byId("idFieldsTable")
                    .getBinding("items")
                    .filter(new Filter({
                        filters: oTableSearchState,
                        and: false
                    }));

            } else {
                this.getView()
                    .byId("idFieldsTable")
                    .getBinding("items").filter([]);
            }
        },

        onSortFields: function () {
            this._bDescendingSort = !this._bDescendingSort;
            var oView = this.getView(),
                oTable = oView.byId("idFieldsTable"),
                oBinding = oTable.getBinding("items"),
                oSorter = new Sorter("FieldName", this._bDescendingSort);

            oBinding.sort(oSorter);
        },

        onFieldUpdateFinished: function (oEvent) {
            this._fieldCount = oEvent.getParameter("total");
            var oScrollContainer = this.getView().byId("idScrollContainerField");
            if (this._fieldCount > 0) {
                var oTitle = this.getView().byId("idFieldTitle");
                oTitle.setProperty("text", "Count: " + this._fieldCount);
            }

            oScrollContainer.setProperty("height", this._getHeight(this._fieldCount, this.byId("idFieldPanel").getVisible()));
        },

        onSelectSegment: function (oEvent) {
            this._sPath = oEvent.getSource().getBindingContextPath();
            var bChanged = false;
            if (this._idocsegment !== null && this.byId("idSegmentSmartForm").getEditable()) {
                if (this._idocsegment.SegmentName === oEvent.getSource().getBindingContext().getProperty("SegmentName")) {
                    MessageToast.show("Segment '" + this._idocsegment.SegmentName + "' is already being edited.");
                    return;
                }
                bChanged = this._checkDataChanged(this._fnCheckOnSwitchSegment);
            }
            if (!bChanged) {
                this.showSegmentDetails(this._sPath, false);
                delete this._sPath;
            } else {
                this._bEditable = false;
            }
        },

        onEditSeg: function (oEvent) {
            this._sPath = oEvent.getSource().getBindingContext().getPath();
            var bChanged = false;
            if (this._idocsegment !== null && this.byId("idSegmentSmartForm").getEditable()) {
                if (this._idocsegment.SegmentName === oEvent.getSource().getBindingContext().getProperty("SegmentName")) {
                    MessageToast.show("Segment '" + this._idocsegment.SegmentName + "' is already being edited.");
                    return;
                }
                bChanged = this._checkDataChanged(this._fnCheckOnSwitchSegment);
            }
            if (!bChanged) {
                this.showSegmentDetails(this._sPath, true);
                delete this._sPath;
            } else {
                this._bEditable = true;
            }
        },

        showSegmentDetails: function (sPath, bEditable) {
            this.getView().byId("idScrollContainerSeg").setProperty("height", this._getHeight(this._segCount, true));
            this.getView().byId("idSegPanel").setVisible(true);

            var oSmartForm = this.getView().byId("idSegmentSmartForm");
            oSmartForm.setVisible(true);
            oSmartForm.setEditTogglable(true);
            oSmartForm.setEditable(bEditable);

            if (oSmartForm.getProperty("editable")) {
                oSmartForm.setProperty("title", "Change IDoc Segment");
                this._bSegEditable = true;
            } else {
                oSmartForm.setProperty("title", "IDoc Segment");
                this._bSegEditable = false;
            }

            oSmartForm.bindElement(sPath);
            oSmartForm.getModel().setDefaultBindingMode("TwoWay");

            /* Get selected IDoc Segment entity*/
            this._idocsegment = this.getView().getModel().getData(sPath);
        },

        //This is for Segment SmartForm
        _checkDataChanged: function (fnName) {
            if (this._idocsegment !==
                this.getView().byId("idSegmentSmartForm").getModel().getData(
                    this.getView().byId("idSegmentSmartForm").getBindingContext().getPath())) {
                MessageBox.confirm("IDoc Segment has changed. Discard Changes?",
                    fnName.bind(this));
                return true;
            } else {
                return false;
            }
        },

        _fnCheckOnSwitchSegment: function (oAction) {
            if (oAction === 'OK') {
                this.getView().byId("idSegmentSmartForm").getModel().resetChanges();
                this.showSegmentDetails(this._sPath, this._bEditable);
            }
            delete this._sPath;
            delete this._bEditable;
        },

        _fnCheckOnEditToggledSeg: function (oAction) {
            if (oAction === 'OK') {
                this.getView().byId("idSegmentSmartForm").getModel().resetChanges();
            } else {
                this.getView().byId("idSegmentSmartForm").setEditable(true);
            };
        },

        onCreateSegment: function (oEvent) {
            if (this._checkCreateMode()) {
                return;
            }

            this.getView().byId("idScrollContainerSeg").setProperty("height", this._getHeight(this._segCount, true));

            this._bSegCreateMode = true;
            this._idocsegment = null;

            var oSmartForm = this.byId("idSegmentSmartForm"),
                oDataModel = this.getView().getModel();
            oSmartForm.unbindContext();
            oSmartForm.getModel().setDefaultBindingMode("TwoWay");
            oSmartForm.setBindingContext(oDataModel.createEntry("/IDocSegmentSet", {
                refreshAfterChange: true,
                properties: {
                    FunctionID: this._functionid,
                    InterfaceID: this._interfaceid
                },
                success: function () {
                    this._bSegCreateMode = null;
                    MessageToast.show("IDoc Segment created successfully.");
                    oSmartForm.setProperty("title", "Change IDoc Segment");
                    this.getView().setBusy(false);
                }.bind(this),
                error: function () {
                    MessageBox.error("IDoc Segment could not be created.");
                    this.getView().setBusy(false);
                    this._bSegCreateMode = null;
                }.bind(this)
            }));

            this.byId("idSegPanel").setVisible(true);
            oSmartForm.setVisible(true);
            oSmartForm.setEditable(true);
            oSmartForm.setEditTogglable(false);
            oSmartForm.setProperty("title", "Create IDoc Segment");

            // this.scrollToElement(oSmartForm, "idSegmentSmartForm");
        },

        onDeleteSegment: function (oEvent) {
            this._segment = oEvent.getSource().getParent().getParent().getAggregation("cells")[0].getProperty("title");
            this._sPath = oEvent.getSource().getParent().getParent().getBindingContextPath();
            MessageBox.confirm("It will delete IDoc Segment '" +
                this._segment +
                "' and all its related fields permanently. Proceed?",
                function (oAction) {
                    if (oAction === 'OK') {
                        this.getView().setBusy(true);
                        this.getView().byId("idSegmentSmartForm").setProperty("visible", false);
                        this.getView().getModel().remove(this._sPath, {
                            refreshAfterChange: true,
                            success: function () {
                                this.getView().setBusy(false);
                                MessageToast.show("Segment '" + this._segment + "' deleted succcessfully.");
                                this.getView().getModel().refresh();
                            }.bind(this),
                            error: function () {
                                this.getView().setBusy(false);
                                MessageToast.show("Error occured while deleting Segment '" + this._segment + "'");
                            }.bind(this)
                        });
                        this.getView().byId("idSegmentSmartForm").setEditable(false);
                        this.byId("idSegPanel").setVisible(false);
                    } else {
                        MessageToast.show("Deletion cancelled.");
                    }
                }.bind(this)
            );
        },

        onEditToggledSeg: function (oEvent) {
            this._bSegEditable = oEvent.getParameter("editable");

            if (this._bFieldEditable) {
                MessageToast.show("A field is being edited. Please save or cancel the changes first.");
                this.getView().byId("idSegmentSmartForm").setEditable(false);
            }

            if (this._idocsegment !== null && this._bSegEditable === false) {
                this._checkDataChanged(this._fnCheckOnEditToggledSeg);
            }

            if (this._bSegEditable) {
                this.getView().byId("idSegmentSmartForm").setProperty("title", "Change IDoc Segment");
                this.bSegEditable = true;
            } else {
                this.getView().byId("idSegmentSmartForm").setProperty("title", "IDoc Segment");
                this.bSegEditable = false;
            }

            this.toggleFooter();
        },

        onCloneSegment: function (oEvent) {
            if (this._checkCreateMode()) {
                return;
            }

            this.getView().byId("idScrollContainerSeg").setProperty("height", this._getHeight(this._segCount, true));

            this._bSegCreateMode = true;
            this._idocsegment = null;

            var oSmartForm = this.byId("idSegmentSmartForm"),
                oDataModel = this.getView().getModel(),
                sPath = oEvent.getSource().getParent().getParent().getBindingContextPath(),
                oData = oDataModel.getData(sPath);

            delete oData.__metadata;
            oData.SegmentName = oData.SegmentName + "_COPY";

            oSmartForm.unbindContext();
            oSmartForm.getModel().setDefaultBindingMode("TwoWay");
            oSmartForm.setBindingContext(oDataModel.createEntry("/IDocSegmentSet", {
                refreshAfterChange: true,
                properties: oData,
                success: function () {
                    this._bSegCreateMode = null;
                    MessageToast.show("IDoc Segment copied successfully.");
                    oSmartForm.setProperty("title", "Change IDoc Segment");
                    this.getView().setBusy(false);
                }.bind(this),
                error: function () {
                    MessageBox.error("IDoc Segment could not be copied.");
                    this.getView().setBusy(false);
                    this._bSegCreateMode = null;
                }.bind(this)
            }));

            this.byId("idSegPanel").setVisible(true);
            oSmartForm.setVisible(true);
            oSmartForm.setEditable(true);
            oSmartForm.setEditTogglable(false);
            oSmartForm.setProperty("title", "Copy IDoc Segment");
        },

        onSearchSegments: function (oEvent) {
            var oTableSearchState = [],
                sQuery = oEvent.getParameter("query");

            if (sQuery && sQuery.length > 0) {
                oTableSearchState = [
                    new Filter("SegmentName", FilterOperator.Contains, sQuery),
                    new Filter("ParentSegment", FilterOperator.Contains, sQuery),
                ];

                this.getView()
                    .byId("idSegmentsTable")
                    .getBinding("items")
                    .filter(new Filter({
                        filters: oTableSearchState,
                        and: false
                    }));

            } else {
                this.getView()
                    .byId("idSegmentsTable")
                    .getBinding("items").filter([]);
            }
        },

        onSortSegments: function () {
            this._bDescendingSort = !this._bDescendingSort;
            var oView = this.getView(),
                oTable = oView.byId("idSegmentsTable"),
                oBinding = oTable.getBinding("items"),
                oSorter = new Sorter("SegmentName", this._bDescendingSort);

            oBinding.sort(oSorter);
        },

        onValidationError: function (oEvent) {
            MessageBox.error(oEvent.getParameter("message"));
            this.getView().byId("idSaveBtn").setEnabled(false);
        },

        onValidationSuccess: function (oEvent) {
            this.getView().byId("idSaveBtn").setEnabled(true);
        },

        getPage: function () {
            return this.byId("ObjectPageLayout");
        },

        toggleFooter: function () {
            this.getPage().setShowFooter(
                (this.getView().byId("idSegmentSmartForm").getEditable() && this.getView().byId("idSegmentSmartForm").getVisible()) ||
                (this.getView().byId("idFieldSmartForm").getEditable() && this.getView().byId("idFieldSmartForm").getVisible()));
        },

        toggleAreaPriority: function () {
            var oTitle = this.getPage().getTitle(),
                sNewPrimaryArea = oTitle.getPrimaryArea() === DynamicPageTitleArea.Begin ? DynamicPageTitleArea.Middle : DynamicPageTitleArea.Begin;
            oTitle.setPrimaryArea(sNewPrimaryArea);
        },

        _getHeight: function (iCount, bFlag) {
            if (bFlag) {
                switch (iCount) {
                    case 0:
                        return "70px";
                        break;
                    case 1:
                        return "80px";
                        break;
                    case 2:
                        return "120px";
                        break;
                    default:
                        return "160px";
                        break;
                }
            } else {

                switch (iCount) {
                    case 0:
                        return "70px";
                        break;
                    case 1:
                        return "80px";
                        break;
                    case 2:
                        return "120px";
                        break;
                    case 3:
                        return "160px";
                        break;
                    case 4:
                        return "200px";
                        break;
                    default:
                        return "240px";
                        break;
                }
            }
        },

        onSegUpdateFinished: function (oEvent) {
            this._segCount = oEvent.getParameter("total");
            var oScrollContainer = this.getView().byId("idScrollContainerSeg");
            if (this._segCount > 0) {
                var oTitle = this.getView().byId("idSegTitle");
                oTitle.setProperty("text", "Count: " + this._segCount);
            }

            var iHeight = this._getHeight(this._segCount, this.byId("idSegPanel").getVisible());
            oScrollContainer.setProperty("height", iHeight);
        },

        onSave: function (oEvent) {
            var oSmartForm = this.getView().byId("idSegmentSmartForm");

            if (this._bSegCreateMode) {
                this.getView().setBusy(true);
                oSmartForm.getModel().submitChanges({
                    // groupId: "newFunction",
                    success: function (oData) {
                        this.getView().setBusy(false);
                        this.getView().byId("idSegmentSmartForm").setEditable(false);
                        // this.toggleFooter();
                        MessageToast.show("IDoc Segment created successfully.");
                        this._bSegCreateMode = null;
                    }.bind(this),
                    error: function (oError) {
                        MessageBox.error("IDoc Segment could not be created.");
                        this.getView().setBusy(false);
                        this._bSegCreateMode = null;
                        // this.getView().byId("idInterfaceSmartForm").setProperty("visible", false);
                    }.bind(this)
                });
                oSmartForm.getModel().resetChanges();

            } else if (this.bSegEditable) {
                debugger;
                var oDataModel = oSmartForm.getModel(),
                    sBindingPath = oSmartForm.getBindingContext().getPath();
                if (this._idocsegment !== oDataModel.getData(sBindingPath)) {
                    var oData = oDataModel.getObject(sBindingPath);
                    delete oData.__metadata;
                    oDataModel.update(sBindingPath,
                        oData, {
                            success: function (oData) {
                                this.getView().byId("idSegmentSmartForm").setEditable(false);
                                this.toggleFooter();
                                MessageToast.show("IDoc Segment updated successfully.")
                            }.bind(this),
                            error: function (oError) {
                                MessageBox.error("Changes could not be saved.");
                            },
                            refreshAfterChange: true
                        }
                    );
                } else {
                    MessageToast.show("IDoc Segment is unchanged");
                }
            }
            oSmartForm = null;

            var oFieldSmartForm = this.getView().byId("idFieldSmartForm");

            if (this._bFieldCreateMode) {
                this.getView().setBusy(true);
                oFieldSmartForm.getModel().submitChanges({
                    // groupId: "newFunction",
                    success: function (oData) {
                        this.getView().setBusy(false);
                        this.getView().byId("idFieldSmartForm").setEditable(false);
                        // this.toggleFooter();
                        MessageToast.show("Field was created successfully.");
                        this._bFieldCreateMode = null;
                    }.bind(this),
                    error: function (oError) {
                        MessageBox.error("Field could not be created.");
                        this.getView().setBusy(false);
                        this._bFieldCreateMode = null;
                        // this.getView().byId("idInterfaceSmartForm").setProperty("visible", false);
                    }.bind(this)
                });
                oFieldSmartForm.getModel().resetChanges();

            } else if (this.bFieldEditable) {

                var oDataModel = oFieldSmartForm.getModel(),
                    sBindingPath = oFieldSmartForm.getBindingContext().getPath();
                if (this._idocsegment !== oDataModel.getData(sBindingPath)) {
                    var oData = oDataModel.getObject(sBindingPath);
                    delete oData.__metadata;
                    oDataModel.update(sBindingPath,
                        oData, {
                            success: function (oData) {
                                this.getView().byId("idFieldSmartForm").setEditable(false);
                                this.toggleFooter();
                                MessageToast.show("Field updated successfully.")
                            }.bind(this),
                            error: function (oError) {
                                MessageBox.error("Changes could not be saved.");
                            },
                            refreshAfterChange: true
                        }
                    );
                } else {
                    MessageToast.show("Field is unchanged");
                }
            }
        },

        onCancel: function (oEvent) {
            var oSegmentSmartForm = this.getView().byId("idSegmentSmartForm");
            if (this._bSegCreateMode) {
                oSegmentSmartForm.getModel().deleteCreatedEntry(oSegmentSmartForm.getBindingContext());
                oSegmentSmartForm.setBindingContext(null)
                oSegmentSmartForm.setVisible(false);
                this.byId("idSegPanel").setVisible(false);
                this._bSegCreateMode = false;
            } else {
                oSegmentSmartForm.getModel().resetChanges();
            }

            oSegmentSmartForm.setEditable(false);
            oSegmentSmartForm = null;

            var oFieldSmartForm = this.getView().byId("idFieldSmartForm");
            if (this._bFieldCreateMode) {
                oFieldSmartForm.getModel().deleteCreatedEntry(oFieldSmartForm.getBindingContext());
                oFieldSmartForm.setBindingContext(null)
                oFieldSmartForm.setVisible(false);
                this.byId("idFieldPanel").setVisible(false);
                this._bFieldCreateMode = false;
            } else {
                oFieldSmartForm.getModel().resetChanges();
            }
            oFieldSmartForm.setEditable(false);

            this.toggleFooter();
        },

        _checkCreateMode: function () {
            if (this._bFieldCreateMode) {
                MessageToast.show("You are already in Field creation mode. Save or cancel the current data first.");
                return true;
            } else if (this._bSegCreateMode) {
                MessageToast.show("You are already in Segment creation mode. Save or cancel the current data first.");
                return true;
            }
        },

        handleClose: function () {
            var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/endColumn/closeColumn");
            this.oRouter.navTo("detail", {
                layout: sNextLayout,
                functionid: this._functionid
            });
        },

        onExit: function () {
            this.oRouter.getRoute("detailDetail").detachPatternMatched(this._onPatternMatch, this);
        },

        handleFullScreen: function () {
            this.bFocusFullScreenButton = true;
            var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/endColumn/fullScreen");
            this.oRouter.navTo("detailDetail", {
                layout: sNextLayout,
                functionid: this._functionid,
                interfaceid: this._interfaceid
            });
        },
        handleExitFullScreen: function () {
            this.bFocusFullScreenButton = true;
            var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/endColumn/exitFullScreen");
            this.oRouter.navTo("detailDetail", {
                layout: sNextLayout,
                functionid: this._functionid,
                interfaceid: this._interfaceid
            });
        },

        scrollToElement: function (oControl, sElement) {

            oControl.addEventDelegate({
                    "onAfterRendering": function () {
                        this.getView().byId("ObjectPageLayout").getScrollDelegate().scrollTo(0,
                            $("#" + this.createId(sElement)).offset().top,
                            800);
                    }
                },
                this
            );

            // oSmartFormField.addEventDelegate({
            //     "onAfterRendering": function () {
            //         this.getView().byId("ObjectPageLayout").getScrollDelegate().scrollTo(0, $("#" + this.createId("idScrollContainerField")).offset()
            //             .top,
            //             800);
            //     }
            // }, this);
        },

        onSegSettingsPress: function () {
            // creates requested dialog if not yet created
            if (!this._oSegDialogs) {
                Fragment.load({
                    name: "zlhslc.view.fragment.SegViewSettingsDialog",
                    controller: this
                }).then(function (oDialog) {
                    this._oSegDialogs = oDialog;
                    this.getView().addDependent(this._oSegDialogs);
                    // opens the dialog
                    this._oSegDialogs.open();
                }.bind(this));
            } else {
                // opens the requested dialog
                this._oSegDialogs.open();
            }
        },
        handleConfirmSeg: function (oEvent) {
            this.performSortGroup(oEvent, "idSegmentsTable");
            this.performFilter(oEvent, "idSegmentsTable", "idSegFilterLabel");
        },

        performFilter: function (oEvent, sTableId, sLabelId) {
            var oParams = oEvent.getParameters(),
                oTable = this.getView().byId(sTableId),
                oBinding = oTable.getBinding("items"),
                aFilters = [];

            if (oParams.filterItems) {
                oParams.filterItems.forEach(function (oItem) {
                    var aSplit = oItem.getKey().split("___"),
                        sPath = aSplit[0],
                        sOperator = aSplit[1],
                        sValue1 = aSplit[2],
                        sValue2 = aSplit[3],
                        oFilter = new Filter(sPath, sOperator, sValue1, sValue2);
                    aFilters.push(oFilter);
                });
            }
            oBinding.filter(aFilters);
            this.byId(sLabelId).setText(oParams.filterString);
        },

        performSortGroup: function (oEvent, sTableId) {
            var oParams = oEvent.getParameters(),
                oTable = this.getView().byId(sTableId),
                oBinding = oTable.getBinding("items"),
                sPath,
                aSorters = [],
                aGroups = [];
            aSorters.push(new Sorter(oParams.sortItem.getKey(), oParams.sortDescending, null));

            if (oParams.groupItem) {
                sPath = oParams.groupItem.getKey();
                aGroups.push(new Sorter(sPath, oParams.groupDescending,
                    function (oContext) {
                        var name = oContext.getProperty(sPath);
                        return {
                            key: name,
                            text: name
                        };
                    }
                ));
            }
            aGroups = aGroups.concat(aSorters);
            oBinding.sort(aGroups);
        },

        onFilterPage: function (oEvent) {
            var aValues = [];
            var aNewItems = [];
            oEvent.getParameters().parentFilterItem.getItems().forEach(function (oItem, i) {
                if (!aValues.includes(oItem.getKey())) {
                    aNewItems.push(oItem);
                }
                aValues.push(oItem.getKey());
            });
            oEvent.getParameters().parentFilterItem.removeAllItems();
            aNewItems.forEach(function (oItem, i) {
                oEvent.getParameters().parentFilterItem.addItem(oItem);
            });
        },

        onFieldSettingsPress: function () {
            // creates requested dialog if not yet created
            if (!this._oFieldDialogs) {
                Fragment.load({
                    name: "zlhslc.view.fragment.FieldViewSettingsDialog",
                    controller: this
                }).then(function (oDialog) {
                    this._oFieldDialogs = oDialog;
                    this.getView().addDependent(this._oFieldDialogs);
                    // opens the dialog
                    this._oFieldDialogs.open();
                }.bind(this));
            } else {
                // opens the requested dialog
                this._oFieldDialogs.open();
            }
        },
        handleConfirmField: function (oEvent) {
            this.performSortGroup(oEvent, "idFieldsTable");
            this.performFilter(oEvent, "idFieldsTable", "idFieldFilterLabel");
        }
    })

});