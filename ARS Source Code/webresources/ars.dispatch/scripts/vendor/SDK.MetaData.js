// =====================================================================
//  This file is part of the Microsoft Dynamics CRM SDK code samples.
//
//  Copyright (C) Microsoft Corporation.  All rights reserved.
//
//  This source code is intended only as a supplement to Microsoft
//  Development Tools and/or on-line documentation.  See these other
//  materials for detailed information regarding Microsoft code samples.
//
//  THIS CODE AND INFORMATION ARE PROVIDED "AS IS" WITHOUT WARRANTY OF ANY
//  KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
//  IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
//  PARTICULAR PURPOSE.
// =====================================================================
// <snippetSDK.MetaData.js>
if (typeof (SDK) == "undefined")
{ SDK = { __namespace: true }; }
// Namespace container for functions in this library.
SDK.MetaData = {
 _Context: function () {
  var errorMessage = "Context is not available.";
  if (typeof GetGlobalContext != "undefined")
  { return GetGlobalContext(); }
  else {
   if (typeof Xrm != "undefined") {
    return Xrm.Page.context;
   }
   else
   { return new Error(errorMessage); }
  }
 },
 _ServerUrl: function () {///<summary>
  /// Private function used to establish the path to the SOAP endpoint based on context
  /// provided by the Xrm.Page object or the context object returned by the GlobalContext object.
  ///</summary>
  var ServerUrl = this._Context().getClientUrl();
  if (ServerUrl.match(/\/$/)) {
   ServerUrl = ServerUrl.substring(0, ServerUrl.length - 1);
  }
  return ServerUrl + "/XRMServices/2011/Organization.svc/web";
 },
 RetrieveAttributeAsync: function (EntityLogicalName, LogicalName, MetadataId, RetrieveAsIfPublished, successCallBack, errorCallBack) {
  var request = "<Execute xmlns=\"http://schemas.microsoft.com/xrm/2011/Contracts/Services\" xmlns:i=\"http://www.w3.org/2001/XMLSchema-instance\">";
  request += "<request i:type=\"a:RetrieveAttributeRequest\" xmlns:a=\"http://schemas.microsoft.com/xrm/2011/Contracts\">";
  request += "<a:Parameters xmlns:b=\"http://schemas.datacontract.org/2004/07/System.Collections.Generic\">";
  request += "<a:KeyValuePairOfstringanyType>";
  request += "<b:key>EntityLogicalName</b:key>";
  request += "<b:value i:type=\"c:string\" xmlns:c=\"http://www.w3.org/2001/XMLSchema\">" + EntityLogicalName + "</b:value>";
  request += "</a:KeyValuePairOfstringanyType>";
  if (MetadataId == null)
  { MetadataId = "00000000-0000-0000-0000-000000000000"; }
  request += "<a:KeyValuePairOfstringanyType>";
  request += "<b:key>MetadataId</b:key>";
  request += "<b:value i:type=\"ser:guid\"  xmlns:ser=\"http://schemas.microsoft.com/2003/10/Serialization/\">" + MetadataId + "</b:value>";
  request += "</a:KeyValuePairOfstringanyType>";
  request += "<a:KeyValuePairOfstringanyType>";
  request += "<b:key>RetrieveAsIfPublished</b:key>";
  request += "<b:value i:type=\"c:boolean\" xmlns:c=\"http://www.w3.org/2001/XMLSchema\">" + RetrieveAsIfPublished + "</b:value>";
  request += "</a:KeyValuePairOfstringanyType>";
  request += "<a:KeyValuePairOfstringanyType>";
  request += "<b:key>LogicalName</b:key>";
  request += "<b:value i:type=\"c:string\"   xmlns:c=\"http://www.w3.org/2001/XMLSchema\">" + LogicalName + "</b:value>";
  request += "</a:KeyValuePairOfstringanyType>";
  request += "</a:Parameters>";
  request += "<a:RequestId i:nil=\"true\" /><a:RequestName>RetrieveAttribute</a:RequestName></request>";
  request += "</Execute>";
  request = this._getSOAPWrapper(request);

  var req = new XMLHttpRequest();
  req.open("POST", this._ServerUrl(), true);
  req.setRequestHeader("Accept", "application/xml, text/xml, */*");
  req.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
  req.setRequestHeader("SOAPAction", this._Action.Execute);
  req.onreadystatechange = function () { SDK.MetaData._returnAttribute(req, successCallBack, errorCallBack) };
  req.send(request);
 },
 _returnAttribute: function (resp, successCallBack, errorCallBack) {
  if (resp.readyState == 4 /* complete */) {
   if (resp.status == 200) {
    //Success				
    //var attributeMetadata = new SDK.MetaData._attributeMetadata(resp.responseXML.selectSingleNode("//b:value"));	
	
	var doc = $(resp.responseXML);
	
    var attributeData = SDK.MetaData._selectSingleNode(doc, "b", "value");	
    var attributeType = SDK.MetaData._selectSingleNode(attributeData, "c", "AttributeType").text();
	
    var attribute = {};
    switch (attributeType) {
     case "BigInt":
      attribute = new SDK.MetaData._bigIntAttributeMetadata(attributeData);
      break;
     case "Boolean":
      attribute = new SDK.MetaData._booleanAttributeMetadata(attributeData);
      break;
     case "CalendarRules":
      attribute = new SDK.MetaData._lookupAttributeMetadata(attributeData);
      break;
     case "Customer":
      attribute = new SDK.MetaData._lookupAttributeMetadata(attributeData);
      break;
     case "DateTime":
      attribute = new SDK.MetaData._dateTimeAttributeMetadata(attributeData);
      break;
     case "Decimal":
      attribute = new SDK.MetaData._decimalAttributeMetadata(attributeData);
      break;
     case "Double":
      attribute = new SDK.MetaData._doubleAttributeMetadata(attributeData);
      break;
     case "EntityName":
      attribute = new SDK.MetaData._entityNameAttributeMetadata(attributeData);
      break;
     case "Integer":
      attribute = new SDK.MetaData._integerAttributeMetadata(attributeData);
      break;
     case "Lookup":
      attribute = new SDK.MetaData._lookupAttributeMetadata(attributeData);
      break;
     case "ManagedProperty":
      attribute = new SDK.MetaData._managedPropertyAttributeMetadata(attributeData);
      break;
     case "Memo":
      attribute = new SDK.MetaData._memoAttributeMetadata(attributeData);
      break;
     case "Money":
      attribute = new SDK.MetaData._moneyAttributeMetadata(attributeData);
      break;
     case "Owner":
      attribute = new SDK.MetaData._lookupAttributeMetadata(attributeData);
      break;
     case "PartyList":
      attribute = new SDK.MetaData._lookupAttributeMetadata(attributeData);
      break;
     case "Picklist":
      attribute = new SDK.MetaData._picklistAttributeMetadata(attributeData);
      break;
     case "State":
      attribute = new SDK.MetaData._stateAttributeMetadata(attributeData);
      break;
     case "Status":
      attribute = new SDK.MetaData._statusAttributeMetadata(attributeData);
      break;
     case "String":
      attribute = new SDK.MetaData._stringAttributeMetadata(attributeData);
      break;
     case "Uniqueidentifier":
      attribute = new SDK.MetaData._attributeMetadata(attributeData);
      break;
     case "Virtual": //Contains the text value of picklist fields
      attribute = new SDK.MetaData._attributeMetadata(attributeData);

      break;
    }

    successCallBack(attribute);
   }
   else {
    //Failure
    errorCallBack(SDK.MetaData._getError(resp));
   }
  }
 },
 _getError: function (resp) {
  ///<summary>
  /// Private function that attempts to parse errors related to connectivity or WCF faults.
  ///</summary>
  ///<param name="resp" type="XMLHttpRequest">
  /// The XMLHttpRequest representing failed response.
  ///</param>

  //Error descriptions come from http://support.microsoft.com/kb/193625
  if (resp.status == 12029)
  { return new Error("The attempt to connect to the server failed."); }
  if (resp.status == 12007)
  { return new Error("The server name could not be resolved."); }
  var faultXml = resp.responseXML;
  var errorMessage = "Unknown (unable to parse the fault)";
  if (typeof faultXml == "object") {

   var bodyNode = $(faultXml.firstChild.firstChild);

   //Retrieve the fault node
   for (var i = 0; i < bodyNode.children().length; i++) {
    var node = bodyNode.children()[i];

    //NOTE: This comparison does not handle the case where the XML namespace changes
    if ("s:Fault" == node.nodeName) {
	  var jNode = $(node);
     for (var j = 0; j < jNode.children().length; j++) {
      var faultStringNode = jNode.children()[j];
      if ("faultstring" == faultStringNode.nodeName) {
       errorMessage = $(faultStringNode).text();
       break;
      }
     }
     break;
    }
   }
  }

  return new Error(errorMessage);

 },
 EntityFilters: {
  All: "Entity Attributes Relationships Privileges",
  Default: "Entity Attributes Relationships Privileges",
  Attributes: "Attributes",
  Entity: "Entity",
  Privileges: "Privileges",
  Relationships: "Relationships"
 },
 _Action: {
  Execute: "http://schemas.microsoft.com/xrm/2011/Contracts/Services/IOrganizationService/Execute"
 },
 _getSOAPWrapper: function (request) {
  ///<summary>
  /// Private function that wraps a soap envelope around a request.
  ///</summary>
  var SOAP = "<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\"><soapenv:Body>";
  SOAP += request;
  SOAP += "</soapenv:Body></soapenv:Envelope>";
  return SOAP;
 },
 _associatedMenuConfiguration: function (node) {
  ///<summary>
  /// Private function that parses xml data describing AssociatedMenuConfiguration
  ///</summary>
  var orderValue;
  if (isNaN(parseInt(SDK.MetaData._selectSingleNode(node, "c", "Order").text(), 10)))
  { orderValue = null; }
  else
  { orderValue = parseInt(SDK.MetaData._selectSingleNode(node, "c", "Order").text(), 10); }
  return {
   Behavior: SDK.MetaData._selectSingleNode(node, "c", "Behavior").text(),
   Group: SDK.MetaData._selectSingleNode(node, "c", "Group").text(),
   Label: new SDK.MetaData._label(SDK.MetaData._selectSingleNode(node, "c", "Label")),
   Order: orderValue
  };
 },
 _oneToManyRelationshipMetadata: function (node) {
  ///<summary>
  /// Private function that parses xml data describing OneToManyRelationshipMetadata
  ///</summary>
  return { OneToManyRelationshipMetadata: {
   MetadataId: SDK.MetaData._selectSingleNode(node, "c", "MetadataId").text(),
   IsCustomRelationship: (SDK.MetaData._selectSingleNode(node, "c", "IsCustomRelationship").text() == "true") ? true : false,
   IsCustomizable: new SDK.MetaData._booleanManagedProperty(SDK.MetaData._selectSingleNode(node, "c", "IsCustomizable")),
   IsManaged: (SDK.MetaData._selectSingleNode(node, "c", "IsManaged").text() == "true") ? true : false,
   IsValidForAdvancedFind: (SDK.MetaData._selectSingleNode(node, "c", "IsValidForAdvancedFind").text() == "true") ? true : false,
   SchemaName: SDK.MetaData._selectSingleNode(node, "c", "SchemaName").text(),
   SecurityTypes: SDK.MetaData._selectSingleNode(node, "c", "SecurityTypes").text(),
   AssociatedMenuConfiguration: new SDK.MetaData._associatedMenuConfiguration(SDK.MetaData._selectSingleNode(node, "c", "AssociatedMenuConfiguration")),
   CascadeConfiguration: {
    Assign: node.find("CascadeConfiguration/c:Assign").text(),
    Delete: node.find("CascadeConfiguration/c:Delete").text(),
    Merge: node.find("CascadeConfiguration/c:Merge").text(),
    Reparent: node.find("CascadeConfiguration/c:Reparent").text(),
    Share: node.find("CascadeConfiguration/c:Share").text(),
    Unshare: node.find("CascadeConfiguration/c:Unshare").text()
   },
   ReferencedAttribute: SDK.MetaData._selectSingleNode(node, "c", "ReferencedAttribute").text(),
   ReferencedEntity: SDK.MetaData._selectSingleNode(node, "c", "ReferencedEntity").text(),
   ReferencingAttribute: SDK.MetaData._selectSingleNode(node, "c", "ReferencingAttribute").text(),
   ReferencingEntity: SDK.MetaData._selectSingleNode(node, "c", "ReferencingEntity").text()
  }
  };
 },
 _manyToManyRelationshipMetadata: function (node) {
  ///<summary>
  /// Private function that parses xml data describing ManyToManyRelationshipMetadata
  ///</summary>
  return { ManyToManyRelationshipMetadata: {
   MetadataId: SDK.MetaData._selectSingleNode(node, "c", "MetadataId").text(),
   IsCustomRelationship: (SDK.MetaData._selectSingleNode(node, "c", "IsCustomRelationship").text() == "true") ? true : false,
   IsCustomizable: new SDK.MetaData._booleanManagedProperty(SDK.MetaData._selectSingleNode(node, "c", "IsCustomizable")),
   IsManaged: (SDK.MetaData._selectSingleNode(node, "c", "IsManaged").text() == "true") ? true : false,
   IsValidForAdvancedFind: (SDK.MetaData._selectSingleNode(node, "c", "IsValidForAdvancedFind").text() == "true") ? true : false,
   SchemaName: SDK.MetaData._selectSingleNode(node, "c", "SchemaName").text(),
   SecurityTypes: SDK.MetaData._selectSingleNode(node, "c", "SecurityTypes").text(),
   Entity1AssociatedMenuConfiguration: new SDK.MetaData._associatedMenuConfiguration(SDK.MetaData._selectSingleNode(node, "c", "Entity1AssociatedMenuConfiguration")),
   Entity1IntersectAttribute: SDK.MetaData._selectSingleNode(node, "c", "Entity1IntersectAttribute").text(),
   Entity1LogicalName: SDK.MetaData._selectSingleNode(node, "c", "Entity1LogicalName").text(),
   Entity2AssociatedMenuConfiguration: new SDK.MetaData._associatedMenuConfiguration(SDK.MetaData._selectSingleNode(node, "c", "Entity2AssociatedMenuConfiguration")),
   Entity2IntersectAttribute: SDK.MetaData._selectSingleNode(node, "c", "Entity2IntersectAttribute").text(),
   Entity2LogicalName: SDK.MetaData._selectSingleNode(node, "c", "Entity2LogicalName").text(),
   IntersectEntityName: SDK.MetaData._selectSingleNode(node, "c", "IntersectEntityName").text()
  }
  };
 },
 _entityMetaData: function (node) {
  ///<summary>
  /// Private function that parses xml data describing EntityMetaData
  ///</summary>
  //Check for Attributes and add them if they are included.
  var attributes = [];
  var attributesData = SDK.MetaData._selectSingleNode(node, "c", "Attributes");
  if (attributesData.children().length > 0) {
   //There are attributes
   for (var i = 0; i < attributesData.children().length; i++) {
    var attributeData = attributesData.children()[i];
    var attributeType = SDK.MetaData._selectSingleNode(attributesData, "c", "AttributeType").text();
    var attribute = {};
    switch (attributeType) {
     case "BigInt":
      attribute = new SDK.MetaData._bigIntAttributeMetadata(attributeData);
      break;
     case "Boolean":
      attribute = new SDK.MetaData._booleanAttributeMetadata(attributeData);
      break;
     case "CalendarRules":
      attribute = new SDK.MetaData._lookupAttributeMetadata(attributeData);
      break;
     case "Customer":
      attribute = new SDK.MetaData._lookupAttributeMetadata(attributeData);
      break;
     case "DateTime":
      attribute = new SDK.MetaData._dateTimeAttributeMetadata(attributeData);
      break;
     case "Decimal":
      attribute = new SDK.MetaData._decimalAttributeMetadata(attributeData);
      break;
     case "Double":
      attribute = new SDK.MetaData._doubleAttributeMetadata(attributeData);
      break;
     case "EntityName":
      attribute = new SDK.MetaData._entityNameAttributeMetadata(attributeData);
      break;
     case "Integer":
      attribute = new SDK.MetaData._integerAttributeMetadata(attributeData);
      break;
     case "Lookup":
      attribute = new SDK.MetaData._lookupAttributeMetadata(attributeData);
      break;
     case "ManagedProperty":
      attribute = new SDK.MetaData._managedPropertyAttributeMetadata(attributeData);
      break;
     case "Memo":
      attribute = new SDK.MetaData._memoAttributeMetadata(attributeData);
      break;
     case "Money":
      attribute = new SDK.MetaData._moneyAttributeMetadata(attributeData);
      break;
     case "Owner":
      attribute = new SDK.MetaData._lookupAttributeMetadata(attributeData);
      break;
     case "PartyList":
      attribute = new SDK.MetaData._lookupAttributeMetadata(attributeData);
      break;
     case "Picklist":
      attribute = new SDK.MetaData._picklistAttributeMetadata(attributeData);
      break;
     case "State":
      attribute = new SDK.MetaData._stateAttributeMetadata(attributeData);
      break;
     case "Status":
      attribute = new SDK.MetaData._statusAttributeMetadata(attributeData);
      break;
     case "String":
      attribute = new SDK.MetaData._stringAttributeMetadata(attributeData);
      break;
     case "Uniqueidentifier":
      attribute = new SDK.MetaData._attributeMetadata(attributeData);
      break;
     case "Virtual": //Contains the text value of picklist fields
      attribute = new SDK.MetaData._attributeMetadata(attributeData);

      break;
    }
    attributes.push(attribute);

   }
   attributes.sort();
  }

  //Check for Privileges and add them if they are included.
  var privileges = [];
  var privilegesData = SDK.MetaData._selectSingleNode(node, "c", "Privileges");
  if (privilegesData.children().length > 0) {
   for (var i = 0; i < privilegesData.children().length; i++) {
    var privilegeData = privilegesData.children()[i];
    var securityPrivilegeMetadata = {
     SecurityPrivilegeMetadata: {
      CanBeBasic: (SDK.MetaData._selectSingleNode(privilegeData, "c", "CanBeBasic").text() == "true") ? true : false,
      CanBeDeep: (SDK.MetaData._selectSingleNode(privilegeData, "c", "CanBeDeep").text() == "true") ? true : false,
      CanBeGlobal: (SDK.MetaData._selectSingleNode(privilegeData, "c", "CanBeGlobal").text() == "true") ? true : false,
      CanBeLocal: (SDK.MetaData._selectSingleNode(privilegeData, "c", "CanBeLocal").text() == "true") ? true : false,
      Name: SDK.MetaData._selectSingleNode(privilegeData, "c", "Name").text(),
      PrivilegeId: SDK.MetaData._selectSingleNode(privilegeData, "c", "PrivilegeId").text(),
      PrivilegeType: SDK.MetaData._selectSingleNode(privilegeData, "c", "PrivilegeType").text()
     }
    };
    privileges.push(securityPrivilegeMetadata);
   }
  }

  //Check for Relationships and add them if they are included.
  var manyToManyRelationships = [];
  var manyToManyRelationshipsData = SDK.MetaData._selectSingleNode(node, "c", "ManyToManyRelationships");
  if (manyToManyRelationshipsData.children().length > 0) {
   for (var i = 0; i < manyToManyRelationshipsData.children().length; i++) {
    var manyToManyRelationshipMetadataData = manyToManyRelationshipsData.children()[i];

    var manyToManyRelationshipMetadata = new SDK.MetaData._manyToManyRelationshipMetadata(manyToManyRelationshipMetadataData);
    manyToManyRelationships.push(manyToManyRelationshipMetadata);
   }
  }

  var manyToOneRelationships = [];
  var manyToOneRelationshipsData = SDK.MetaData._selectSingleNode(node, "c", "ManyToOneRelationships");
  if (manyToOneRelationshipsData.children().length > 0) {

   for (var i = 0; i < manyToOneRelationshipsData.children().length; i++) {
    var manyToOneRelationshipMetadata = new SDK.MetaData._oneToManyRelationshipMetadata(manyToOneRelationshipsData.children()[i]);

    manyToOneRelationships.push(manyToOneRelationshipMetadata);

   }

  }

  var oneToManyRelationships = [];
  var oneToManyRelationshipsData = SDK.MetaData._selectSingleNode(node, "c", "OneToManyRelationships");
  if (oneToManyRelationshipsData.children().length > 0) {
   for (var i = 0; i < oneToManyRelationshipsData.children().length; i++) {
    var oneToManyRelationshipMetadata = new SDK.MetaData._oneToManyRelationshipMetadata(oneToManyRelationshipsData.children()[i]);
    oneToManyRelationships.push(oneToManyRelationshipMetadata);
   }
  }


  return {
   ActivityTypeMask: SDK.MetaData._nullableInt(SDK.MetaData._selectSingleNode(node, "c", "ActivityTypeMask")),
   Attributes: attributes,
   AutoRouteToOwnerQueue: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "AutoRouteToOwnerQueue")),
   CanBeInManyToMany: new SDK.MetaData._booleanManagedProperty(SDK.MetaData._selectSingleNode(node, "c", "CanBeInManyToMany")),
   CanBePrimaryEntityInRelationship: new SDK.MetaData._booleanManagedProperty(SDK.MetaData._selectSingleNode(node, "c", "CanBePrimaryEntityInRelationship")),
   CanBeRelatedEntityInRelationship: new SDK.MetaData._booleanManagedProperty(SDK.MetaData._selectSingleNode(node, "c", "CanBeRelatedEntityInRelationship")),
   CanCreateAttributes: new SDK.MetaData._booleanManagedProperty(SDK.MetaData._selectSingleNode(node, "c", "CanCreateAttributes")),
   CanCreateCharts: new SDK.MetaData._booleanManagedProperty(SDK.MetaData._selectSingleNode(node, "c", "CanCreateCharts")),
   CanCreateForms: new SDK.MetaData._booleanManagedProperty(SDK.MetaData._selectSingleNode(node, "c", "CanCreateForms")),
   CanCreateViews: new SDK.MetaData._booleanManagedProperty(SDK.MetaData._selectSingleNode(node, "c", "CanCreateViews")),
   CanModifyAdditionalSettings: new SDK.MetaData._booleanManagedProperty(SDK.MetaData._selectSingleNode(node, "c", "CanModifyAdditionalSettings")),
   CanTriggerWorkflow: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "CanTriggerWorkflow")),
   Description: new SDK.MetaData._label(SDK.MetaData._selectSingleNode(node, "c", "Description")),
   DisplayCollectionName: new SDK.MetaData._label(SDK.MetaData._selectSingleNode(node, "c", "DisplayCollectionName")),
   DisplayName: new SDK.MetaData._label(SDK.MetaData._selectSingleNode(node, "c", "DisplayName")),
   IconLargeName: SDK.MetaData._selectSingleNode(node, "c", "IconLargeName").text(),
   IconMediumName: SDK.MetaData._selectSingleNode(node, "c", "IconMediumName").text(),
   IconSmallName: SDK.MetaData._selectSingleNode(node, "c", "IconSmallName").text(),
   IsActivity: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "IsActivity")),
   IsActivityParty: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "IsActivityParty")),
   IsAuditEnabled: new SDK.MetaData._booleanManagedProperty(SDK.MetaData._selectSingleNode(node, "c", "IsAuditEnabled")),
   IsAvailableOffline: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "IsAvailableOffline")),
   IsChildEntity: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "IsChildEntity")),
   IsConnectionsEnabled: new SDK.MetaData._booleanManagedProperty(SDK.MetaData._selectSingleNode(node, "c", "IsConnectionsEnabled")),
   IsCustomEntity: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "IsCustomEntity")),
   IsCustomizable: new SDK.MetaData._booleanManagedProperty(SDK.MetaData._selectSingleNode(node, "c", "IsCustomizable")),
   IsDocumentManagementEnabled: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "IsDocumentManagementEnabled")),
   IsDuplicateDetectionEnabled: new SDK.MetaData._booleanManagedProperty(SDK.MetaData._selectSingleNode(node, "c", "IsDuplicateDetectionEnabled")),
   IsEnabledForCharts: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "IsEnabledForCharts")),
   IsImportable: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "IsImportable")),
   IsIntersect: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "IsIntersect")),
   IsMailMergeEnabled: new SDK.MetaData._booleanManagedProperty(SDK.MetaData._selectSingleNode(node, "c", "IsMailMergeEnabled")),
   IsManaged: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "IsManaged")),
   IsMappable: new SDK.MetaData._booleanManagedProperty(SDK.MetaData._selectSingleNode(node, "c", "IsMappable")),
   IsReadingPaneEnabled: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "IsReadingPaneEnabled")),
   IsRenameable: new SDK.MetaData._booleanManagedProperty(SDK.MetaData._selectSingleNode(node, "c", "IsRenameable")),
   IsValidForAdvancedFind: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "IsValidForAdvancedFind")),
   IsValidForQueue: new SDK.MetaData._booleanManagedProperty(SDK.MetaData._selectSingleNode(node, "c", "IsValidForQueue")),
   IsVisibleInMobile: new SDK.MetaData._booleanManagedProperty(SDK.MetaData._selectSingleNode(node, "c", "IsVisibleInMobile")),
   LogicalName: SDK.MetaData._selectSingleNode(node, "c", "LogicalName").text(),
   ManyToManyRelationships: manyToManyRelationships,
   ManyToOneRelationships: manyToOneRelationships,
   MetadataId: SDK.MetaData._selectSingleNode(node, "c", "MetadataId").text(),
   ObjectTypeCode: SDK.MetaData._nullableInt(SDK.MetaData._selectSingleNode(node, "c", "ObjectTypeCode")),
   OneToManyRelationships: oneToManyRelationships,
   OwnershipType: SDK.MetaData._selectSingleNode(node, "c", "OwnershipType").text(),
   PrimaryIdAttribute: SDK.MetaData._selectSingleNode(node, "c", "PrimaryIdAttribute").text(),
   PrimaryNameAttribute: SDK.MetaData._selectSingleNode(node, "c", "PrimaryNameAttribute").text(),
   Privileges: privileges,
   RecurrenceBaseEntityLogicalName: SDK.MetaData._selectSingleNode(node, "c", "RecurrenceBaseEntityLogicalName").text(),
   ReportViewName: SDK.MetaData._selectSingleNode(node, "c", "ReportViewName").text(),
   SchemaName: SDK.MetaData._selectSingleNode(node, "c", "SchemaName").text(),
   // So the LogicalName property will be used for an array.sort().
   toString: function () { return this.LogicalName }
  };


 },
 _nullableInt: function (node) {
  ///<summary>
  /// Private function that parses xml data describing nullable Integer values
  ///</summary>
  if (node.text() == "")
  { return null; }
  else
  { return parseInt(node.text(), 10); }

 },
 _nullableBoolean: function (node) {
  ///<summary>
  /// Private function that parses xml data describing nullable Boolean values
  ///</summary>
  if (node.text() == "")
  { return null; }
  if (node.text() == "true")
  { return true; }
  else
  { return false; }
 },
 _booleanManagedProperty: function (node) {
  ///<summary>
  /// Private function that parses xml data describing BooleanManagedProperty 
  ///</summary>
  return {
   CanBeChanged: (SDK.MetaData._selectSingleNode(node, "c", "CanBeChanged").text() == "true") ? true : false,
   ManagedPropertyLogicalName: SDK.MetaData._selectSingleNode(node, "c", "ManagedPropertyLogicalName").text(),
   Value: (SDK.MetaData._selectSingleNode(node, "c", "Value").text() == "true") ? true : false
  };

 },
 _requiredLevelManagedProperty: function (node) {
  ///<summary>
  /// Private function that parses xml data describing AttributeRequiredLevelManagedProperty  
  ///</summary>
  return {
   CanBeChanged: (SDK.MetaData._selectSingleNode(node, "a", "CanBeChanged").text() == "true") ? true : false,
   ManagedPropertyLogicalName: SDK.MetaData._selectSingleNode(node, "a", "ManagedPropertyLogicalName").text(),
   Value: SDK.MetaData._selectSingleNode(node, "a", "Value").text()
  };

 },
 _label: function (node) {
  ///<summary>
  /// Private function that parses xml data describing Label 
  ///</summary>
  if (node.text() == "") {
   return {
    LocalizedLabels: [],
    UserLocalizedLabel: null
   };
  }
  else {
   var locLabels = SDK.MetaData._selectSingleNode(node, "a", "LocalizedLabels");
   var userLocLabel = SDK.MetaData._selectSingleNode(node, "a", "UserLocalizedLabel");
   var arrLocLabels = [];
   
   var childrens = locLabels.children();
   for (var i = 0; i < childrens.length; i++) {
    var LocLabelNode = $(childrens[i]);
    var locLabel = {
     LocalizedLabel: {
      IsManaged: (SDK.MetaData._selectSingleNode(LocLabelNode, "a", "IsManaged").text() == "true") ? true : false,
      Label: SDK.MetaData._selectSingleNode(LocLabelNode, "a", "Label").text(),
      LanguageCode: parseInt(SDK.MetaData._selectSingleNode(LocLabelNode, "a", "LanguageCode").text(), 10)
     }
    };
    arrLocLabels.push(locLabel);
   }

   return {
    LocalizedLabels: arrLocLabels,
    UserLocalizedLabel: {
     IsManaged: (SDK.MetaData._selectSingleNode(userLocLabel, "a", "IsManaged").text() == "true") ? true : false,
     Label: SDK.MetaData._selectSingleNode(userLocLabel, "a", "Label").text(),
     LanguageCode: parseInt(SDK.MetaData._selectSingleNode(userLocLabel, "a", "LanguageCode").text(), 10)
    }
   };

  }


 },
 _options: function (node) {
  ///<summary>
  /// Private function that parses xml data describing OptionSetMetadata Options 
  ///</summary>
  var optionMetadatas = [];
  var options = node.children();
  for (var i = 0; i < options.length; i++) {
   var optionMetadata = $(options[i]);
   var option;
   // TODO: handle state and statuses
     option = { OptionMetadata:
			    { MetadataId: SDK.MetaData._selectSingleNode(optionMetadata, "c", "MetadataId").text(),
			     Description: new SDK.MetaData._label(SDK.MetaData._selectSingleNode(optionMetadata, "c", "Description")),
			     IsManaged: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(optionMetadata, "c", "IsManaged")),
			     Label: new SDK.MetaData._label(SDK.MetaData._selectSingleNode(optionMetadata, "c", "Label")),
			     Value: parseInt(SDK.MetaData._selectSingleNode(optionMetadata, "c", "Value").text(), 10)
			    }
    };
   
   optionMetadatas.push(option);

  }
  return optionMetadatas;
 },
 _booleanOptionSet: function (node) {
  ///<summary>
  /// Private function that parses xml data describing BooleanOptionSetMetadata 
  ///</summary>
  if (node.children().length == 0)
  { return null; }
  else {
   return {
    MetadataId: SDK.MetaData._selectSingleNode(node, "c", "MetadataId").text(),
    Description: new SDK.MetaData._label(SDK.MetaData._selectSingleNode(node, "c", "Description")),
    DisplayName: new SDK.MetaData._label(SDK.MetaData._selectSingleNode(node, "c", "DisplayName")),
    IsCustomOptionSet: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "IsCustomOptionSet")),
    IsCustomizable: new SDK.MetaData._booleanManagedProperty(SDK.MetaData._selectSingleNode(node, "c", "IsCustomizable")),
    IsGlobal: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "IsGlobal")),
    IsManaged: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "IsManaged")),
    Name: SDK.MetaData._selectSingleNode(node, "c", "Name").text(),
    OptionSetType: SDK.MetaData._selectSingleNode(node, "c", "OptionSetType").text(),
    FalseOption: {
     MetadataId: node.find("FalseOption/c:MetadataId").text(),
     Description: new SDK.MetaData._label(node.find("FalseOption/c:Description")),
     IsManaged: SDK.MetaData._nullableBoolean(node.find("FalseOption/c:IsManaged")),
     Label: new SDK.MetaData._label(node.find("FalseOption/c:Label")),
     Value: parseInt(node.find("FalseOption/c:Value").text(), 10)
    },
    TrueOption: {
     MetadataId: node.find("TrueOption/c:MetadataId").text(),
     Description: new SDK.MetaData._label(node.find("TrueOption/c:Description")),
     IsManaged: SDK.MetaData._nullableBoolean(node.find("TrueOption/c:IsManaged")),
     Label: new SDK.MetaData._label(node.find("TrueOption/c:Label")),
     Value: parseInt(node.find("TrueOption/c:Value").text(), 10)
    }
   };
  }


 },
 _optionSet: function (node) {
  ///<summary>
  /// Private function that parses xml data describing OptionSetMetadata 
  ///</summary>
  if (node.children().length == 0)
  { return null; }
  else {
   return {
    MetadataId: SDK.MetaData._selectSingleNode(node, "c", "MetadataId").text(),
    Description: new SDK.MetaData._label(SDK.MetaData._selectSingleNode(node, "c", "Description")),
    DisplayName: new SDK.MetaData._label(SDK.MetaData._selectSingleNode(node, "c", "DisplayName")),
    IsCustomOptionSet: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "IsCustomOptionSet")),
    IsCustomizable: new SDK.MetaData._booleanManagedProperty(SDK.MetaData._selectSingleNode(node, "c", "IsCustomizable")),
    IsGlobal: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "IsGlobal")),
    IsManaged: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "IsManaged")),
    Name: SDK.MetaData._selectSingleNode(node, "c", "Name").text(),
    OptionSetType: SDK.MetaData._selectSingleNode(node, "c", "OptionSetType").text(),
    Options: new SDK.MetaData._options(SDK.MetaData._selectSingleNode(node, "c", "Options"))
   };
  }


 },
 _attributeMetadata: function (node) {
  ///<summary>
  /// Private function that parses xml data describing AttributeMetadata 
  ///</summary>
  return {
   AttributeOf: SDK.MetaData._selectSingleNode(node, "c", "AttributeOf").text(),
   AttributeType: SDK.MetaData._selectSingleNode(node, "c", "AttributeType").text(),
   CanBeSecuredForCreate: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "CanBeSecuredForCreate")),
   CanBeSecuredForRead: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "CanBeSecuredForRead")),
   CanBeSecuredForUpdate: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "CanBeSecuredForUpdate")),
   CanModifyAdditionalSettings: new SDK.MetaData._booleanManagedProperty(SDK.MetaData._selectSingleNode(node, "c", "CanModifyAdditionalSettings")),
   ColumnNumber: SDK.MetaData._nullableInt(SDK.MetaData._selectSingleNode(node, "c", "ColumnNumber")),
   DeprecatedVersion: SDK.MetaData._selectSingleNode(node, "c", "DeprecatedVersion").text(),
   Description: new SDK.MetaData._label(SDK.MetaData._selectSingleNode(node, "c", "Description")),
   DisplayName: new SDK.MetaData._label(SDK.MetaData._selectSingleNode(node, "c", "DisplayName")),
   EntityLogicalName: SDK.MetaData._selectSingleNode(node, "c", "EntityLogicalName").text(),
   ExtensionData: null, //No node for ExtensionData
   IsAuditEnabled: new SDK.MetaData._booleanManagedProperty(SDK.MetaData._selectSingleNode(node, "c", "IsAuditEnabled")),
   IsCustomAttribute: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "IsCustomAttribute")),
   IsCustomizable: new SDK.MetaData._booleanManagedProperty(SDK.MetaData._selectSingleNode(node, "c", "IsCustomizable")),
   IsManaged: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "IsManaged")),
   IsPrimaryId: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "IsPrimaryId")),
   IsPrimaryName: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "IsPrimaryName")),
   IsRenameable: new SDK.MetaData._booleanManagedProperty(SDK.MetaData._selectSingleNode(node, "c", "IsRenameable")),
   IsSecured: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "IsSecured")),
   IsValidForAdvancedFind: new SDK.MetaData._booleanManagedProperty(SDK.MetaData._selectSingleNode(node, "c", "IsValidForAdvancedFind")),
   IsValidForCreate: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "IsValidForCreate")),
   IsValidForRead: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "IsValidForRead")),
   IsValidForUpdate: SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "IsValidForUpdate")),
   LinkedAttributeId: SDK.MetaData._selectSingleNode(node, "c", "LinkedAttributeId").text(),
   LogicalName: SDK.MetaData._selectSingleNode(node, "c", "LogicalName").text(),
   MetadataId: SDK.MetaData._selectSingleNode(node, "c", "MetadataId").text(),
   RequiredLevel: new SDK.MetaData._requiredLevelManagedProperty(SDK.MetaData._selectSingleNode(node, "c", "RequiredLevel")),
   SchemaName: SDK.MetaData._selectSingleNode(node, "c", "SchemaName").text(),
   toString: function ()
   { return this.LogicalName; }
  };
 },
 _enumAttributeMetadata: function (node) {
  ///<summary>
  /// Private function that parses xml data describing EnumAttributeMetadata 
  ///</summary>
 
  var attributeMetadata = new SDK.MetaData._attributeMetadata(node);
  //FIXED: DefaultFormValue was using _nullableBoolean. 
  attributeMetadata.DefaultFormValue = SDK.MetaData._nullableInt(SDK.MetaData._selectSingleNode(node, "c", "DefaultFormValue")),
		attributeMetadata.OptionSet = new SDK.MetaData._optionSet(SDK.MetaData._selectSingleNode(node, "c", "OptionSet"));

  return attributeMetadata;

 },
 _stateAttributeMetadata: function (node) {
  ///<summary>
  /// Private function that parses xml data describing StateAttributeMetadata 
  ///</summary>
  var enumAttributeMetadata = new SDK.MetaData._enumAttributeMetadata(node);

  return enumAttributeMetadata;
 },
 _stringAttributeMetadata: function (node) {
  ///<summary>
  /// Private function that parses xml data describing StringAttributeMetadata 
  ///</summary>
  var attributeMetadata = new SDK.MetaData._attributeMetadata(node);

  attributeMetadata.Format = SDK.MetaData._selectSingleNode(node, "c", "Format").text();
  attributeMetadata.ImeMode = SDK.MetaData._selectSingleNode(node, "c", "ImeMode").text();
  attributeMetadata.MaxLength = parseInt(SDK.MetaData._selectSingleNode(node, "c", "MaxLength").text(), 10);
  attributeMetadata.YomiOf = SDK.MetaData._selectSingleNode(node, "c", "YomiOf").text();

  return attributeMetadata;

 },
 _managedPropertyAttributeMetadata: function (node) {
  ///<summary>
  /// Private function that parses xml data describing ManagedPropertyAttributeMetadata 
  ///</summary>
  var attributeMetadata = new SDK.MetaData._attributeMetadata(node);
  attributeMetadata.ManagedPropertyLogicalName = SDK.MetaData._selectSingleNode(node, "c", "ManagedPropertyLogicalName").text();
  attributeMetadata.ParentAttributeName = SDK.MetaData._selectSingleNode(node, "c", "ParentAttributeName").text();
  attributeMetadata.ParentComponentType = SDK.MetaData._nullableInt(SDK.MetaData._selectSingleNode(node, "c", "ParentComponentType"));
  attributeMetadata.ValueAttributeTypeCode = SDK.MetaData._selectSingleNode(node, "c", "ValueAttributeTypeCode").text();

  return attributeMetadata;

 },
 _bigIntAttributeMetadata: function (node) {
  ///<summary>
  /// Private function that parses xml data describing BigIntAttributeMetadata 
  ///</summary>
  var attributeMetadata = new SDK.MetaData._attributeMetadata(node);
  attributeMetadata.MaxValue = SDK.MetaData._selectSingleNode(node, "c", "MaxValue").text();
  attributeMetadata.MinValue = SDK.MetaData._selectSingleNode(node, "c", "MaxValue").text();

  return attributeMetadata;

 },
 _booleanAttributeMetadata: function (node) {
  ///<summary>
  /// Private function that parses xml data describing BooleanAttributeMetadata 
  ///</summary>
  var attributeMetadata = new SDK.MetaData._attributeMetadata(node);
  attributeMetadata.DefaultValue = SDK.MetaData._nullableBoolean(SDK.MetaData._selectSingleNode(node, "c", "DefaultValue"));
  attributeMetadata.OptionSet = new SDK.MetaData._booleanOptionSet(SDK.MetaData._selectSingleNode(node, "c", "OptionSet"));

  return attributeMetadata;
 },
 _dateTimeAttributeMetadata: function (node) {
  ///<summary>
  /// Private function that parses xml data describing DateTimeAttributeMetadata 
  ///</summary>
  var attributeMetadata = new SDK.MetaData._attributeMetadata(node);
  attributeMetadata.Format = SDK.MetaData._selectSingleNode(node, "c", "Format").text();
  attributeMetadata.ImeMode = SDK.MetaData._selectSingleNode(node, "c", "ImeMode").text();


  return attributeMetadata;
 },
 _decimalAttributeMetadata: function (node) {
  ///<summary>
  /// Private function that parses xml data describing DecimalAttributeMetadata 
  ///</summary>
  var attributeMetadata = new SDK.MetaData._attributeMetadata(node);
  attributeMetadata.ImeMode = SDK.MetaData._selectSingleNode(node, "c", "ImeMode").text();
  attributeMetadata.MaxValue = SDK.MetaData._selectSingleNode(node, "c", "MaxValue").text();
  attributeMetadata.MinValue = SDK.MetaData._selectSingleNode(node, "c", "MinValue").text();
  attributeMetadata.Precision = parseInt(SDK.MetaData._selectSingleNode(node, "c", "Precision").text(), 10);

  return attributeMetadata;
 },
 _doubleAttributeMetadata: function (node) {
  ///<summary>
  /// Private function that parses xml data describing DoubleAttributeMetadata 
  ///</summary>
  var attributeMetadata = new SDK.MetaData._attributeMetadata(node);
  attributeMetadata.ImeMode = SDK.MetaData._selectSingleNode(node, "c", "ImeMode").text(),
		attributeMetadata.MaxValue = SDK.MetaData._selectSingleNode(node, "c", "MaxValue").text();
  attributeMetadata.MinValue = SDK.MetaData._selectSingleNode(node, "c", "MinValue").text();
  attributeMetadata.Precision = parseInt(SDK.MetaData._selectSingleNode(node, "c", "Precision").text(), 10);

  return attributeMetadata;
 },
 _entityNameAttributeMetadata: function (node) {
  ///<summary>
  /// Private function that parses xml data describing EntityNameAttributeMetadata 
  ///</summary>
  var _enumAttributeMetadata = new SDK.MetaData._enumAttributeMetadata(node);

  return _enumAttributeMetadata;
 },
 _integerAttributeMetadata: function (node) {
  ///<summary>
  /// Private function that parses xml data describing IntegerAttributeMetadata 
  ///</summary>
  var attributeMetadata = new SDK.MetaData._attributeMetadata(node);
  attributeMetadata.Format = SDK.MetaData._selectSingleNode(node, "c", "Format").text();
  attributeMetadata.MaxValue = parseInt(SDK.MetaData._selectSingleNode(node, "c", "MaxValue").text(), 10);
  attributeMetadata.MinValue = parseInt(SDK.MetaData._selectSingleNode(node, "c", "MinValue").text(), 10);

  return attributeMetadata;
 },
 _picklistAttributeMetadata: function (node) {
  ///<summary>
  /// Private function that parses xml data describing PicklistAttributeMetadata 
  ///</summary>
  var enumAttributeMetadata = new SDK.MetaData._enumAttributeMetadata(node);

  return enumAttributeMetadata;
 },
 _statusAttributeMetadata: function (node) {
  ///<summary>
  /// Private function that parses xml data describing StatusAttributeMetadata 
  ///</summary>
  var enumAttributeMetadata = new SDK.MetaData._enumAttributeMetadata(node);


  return enumAttributeMetadata;
 },
 _memoAttributeMetadata: function (node) {
  ///<summary>
  /// Private function that parses xml data describing MemoAttributeMetadata 
  ///</summary>
  var attributeMetadata = new SDK.MetaData._attributeMetadata(node);
  attributeMetadata.Format = SDK.MetaData._selectSingleNode(node, "c", "Format").text();
  attributeMetadata.ImeMode = SDK.MetaData._selectSingleNode(node, "c", "ImeMode").text();
  attributeMetadata.MaxLength = parseInt(SDK.MetaData._selectSingleNode(node, "c", "MaxLength").text(), 10);

  return attributeMetadata;
 },
 _moneyAttributeMetadata: function (node) {
  ///<summary>
  /// Private function that parses xml data describing MoneyAttributeMetadata 
  ///</summary>
  var attributeMetadata = new SDK.MetaData._attributeMetadata(node);
  attributeMetadata.CalculationOf = SDK.MetaData._selectSingleNode(node, "c", "CalculationOf").text();
  attributeMetadata.ImeMode = SDK.MetaData._selectSingleNode(node, "c", "ImeMode").text();
  attributeMetadata.MaxValue = SDK.MetaData._selectSingleNode(node, "c", "MaxValue").text();
  attributeMetadata.MinValue = SDK.MetaData._selectSingleNode(node, "c", "MinValue").text();
  attributeMetadata.Precision = parseInt(SDK.MetaData._selectSingleNode(node, "c", "Precision").text(), 10);
  attributeMetadata.PrecisionSource = SDK.MetaData._nullableInt(SDK.MetaData._selectSingleNode(node, "c", "PrecisionSource"));

  return attributeMetadata;
 },
 _lookupAttributeMetadata: function (node) {
  ///<summary>
  /// Private function that parses xml data describing LookupAttributeMetadata 
  ///</summary>
  var attributeMetadata = new SDK.MetaData._attributeMetadata(node);
  attributeMetadata.Targets = null;

  return attributeMetadata;
 },	
 __namespace: true,
 _selectSingleNode: function (node, namespace, nodeName) { 
	var result = node.find(nodeName);
	if (result.length === 0) {
		return node.find(namespace + "\\:" + nodeName);
	}
	
	return result;
 }
};
// </snippetSDK.MetaData.js>
