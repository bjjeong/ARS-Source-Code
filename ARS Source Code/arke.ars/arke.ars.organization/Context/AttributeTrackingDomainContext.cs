using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Client;
using Microsoft.Xrm.Sdk.Messages;

namespace Arke.ARS.Organization.Context
{
    /// <summary>
    /// Provide attribute level change tracking support for CRM to LINQ
    /// For more info see article: http://complexitykills.blogspot.com/2012/06/linq-to-crm-2011-attribute-level-change.html
    /// </summary>
    public sealed class AttributeTrackingDomainContext : ArsOrganizationContext
    {
        public AttributeTrackingDomainContext(IOrganizationService service)
            : base(service)
        {
        }

        private readonly List<Entity> _originalEntities = new List<Entity>();
        private readonly List<Entity> _deltaEntities = new List<Entity>();

        private bool _enableAttributeChangeTracking = true;

        /// <summary>
        /// Enables or disables Attribute Level Change tracking.
        /// Default is On.
        /// </summary>
        public bool EnableAttributeChangeTracking
        {
            get
            {
                return _enableAttributeChangeTracking;
            }

            set
            {
                if (_originalEntities.Count > 0 && value == false)
                {
                    throw new Exception("You cannot disable attribute change tracking at this time, entities are already being tracked");
                }

                _enableAttributeChangeTracking = value;
            }
        }

        /// <summary>
        /// Overrides the base OnBeginEntityTracking method
        /// When an entity is tracked, this adds the original unmodified version of that entity
        /// to the unchangedEntities list (which contains the original version of every entity).
        /// </summary>
        /// <param name="entity">The entity to be tracked by the Microsoft.Xrm.Sdk.Client.OrganizationServiceContext</param>
        protected override void OnBeginEntityTracking(Entity entity)
        {
            base.OnBeginEntityTracking(entity);

            if (_enableAttributeChangeTracking && entity.EntityState == EntityState.Unchanged)
            {
                var exists = _originalEntities.FirstOrDefault(x => x.Id == entity.Id);
                if (exists == null)
                {
                    _originalEntities.Add(ShallowClone(entity));
                }
            }
        }

        /// <summary>
        /// Overrides the base OnEndEntityTracking method
        /// For any entity that is detached from entity tracking, this also 
        /// removes it from the unchangedEntities list (which contains the original version of every entity)
        /// </summary>
        /// <param name="entity">The entity to be tracked by the Microsoft.Xrm.Sdk.Client.OrganizationServiceContext</param>
        protected override void OnEndEntityTracking(Entity entity)
        {
            base.OnEndEntityTracking(entity);
            if (_enableAttributeChangeTracking)
            {
                var exists1 = _originalEntities.FirstOrDefault(x => x.Id == entity.Id);
                if (exists1 != null)
                {
                    _originalEntities.Remove(exists1);
                }

                var exists2 = _deltaEntities.FirstOrDefault(x => x.Id == entity.Id);
                if (exists2 != null)
                {
                    _deltaEntities.Remove(exists2);
                }
            }
        }

        /// <summary>
        /// Overrides the base OnExecuting Method
        /// For UpdateRequests, replaces the target entity on the update message
        /// with an entity that only contains the key and the changed attributes.
        /// </summary>
        /// <param name="request">The request being processed.</param>
        protected override void OnExecuting(OrganizationRequest request)
        {
            if (_enableAttributeChangeTracking && request is UpdateRequest)
            {
                var updateRequest = (UpdateRequest)request;
                var target = updateRequest.Target;
                var newTarget = _deltaEntities.FirstOrDefault(x => x.Id == target.Id);
                updateRequest.Target = newTarget;
            }

            base.OnExecuting(request);
        }

        /// <summary>
        /// Overrides the base OnSavingChangesMethod
        /// For each entity, determines if an update is required.
        /// If no update is required, it detaches and reattaches to set the entity back to a "unchanged" state.
        /// Also create the entity that will ACTUALLY be subitted to the database (used in the OnExecuting method).
        /// </summary>
        /// <param name="options">Save changes options.</param>
        protected override void OnSavingChanges(SaveChangesOptions options)
        {
            // Clear the list of entities to be sumbitted
            _deltaEntities.Clear();

            // Mark any entities as unchanged that
            // are only sending the key
            Entity[] updated = GetAttachedEntities().Where(x => x.EntityState == EntityState.Changed).ToArray();

            foreach (Entity target in updated)
            {
                // Ignore updates where nothing has been updated
                Entity unchanged = _originalEntities.Find(x => x.Id == target.Id);
                if (unchanged != null)
                {
                    Entity cloneOfTarget = ShallowClone(target);
                    RemoveUnchangedFields(cloneOfTarget, unchanged);
                    _deltaEntities.Add(cloneOfTarget);

                    // Test to see if it's only the key left... if so ignore the update otherwise you will get a blank audit record
                    if (cloneOfTarget.Attributes.Count == 1)
                    {
                        object attribute = cloneOfTarget.Attributes.First().Value;

                        var id = attribute as Guid?;
                        if (id != null)
                        {
                            if (cloneOfTarget.Id == id.Value)
                            {
                                Detach(target);
                                _deltaEntities.Remove(cloneOfTarget);
                                target.EntityState = EntityState.Unchanged;
                                Attach(target);
                            }
                        }
                    }
                }
            }

            base.OnSavingChanges(options);
        }

        protected override void OnSaveChanges(SaveChangesResultCollection results)
        {
            _deltaEntities.Clear();
            base.OnSaveChanges(results);
        }

        /// <summary>
        /// Overrides the base OnExecute Method
        /// For Update Requests, if an error was thrown ignores it if Target is null (i.e. no need to update)
        /// </summary>
        /// <param name="request">The request being processed.</param>
        /// <param name="exception">The exception thrown from processing the request.</param>
        protected override void OnExecute(OrganizationRequest request, Exception exception)
        {
            if (_enableAttributeChangeTracking && request is UpdateRequest)
            {
                var updateRequest = (UpdateRequest)request;

                if (updateRequest.Target != null)
                {
                    base.OnExecute(request, exception);
                }
            }
            else
            {
                base.OnExecute(request, exception);
            }
        }

        /// <summary>
        /// This method loops through comparing the changed entity with the unchanged entity
        /// and removed the unchanged fields from the changed entity. Keys are kept.
        /// </summary>
        /// <param name="changed">The enitity with changed attributes.</param>
        /// <param name="unchanged">The same enitity with unchanged attributes</param>
        private static void RemoveUnchangedFields(Entity changed, Entity unchanged)
        {
            // Lookp through the changed fields, if there is one missing from the unchanged list, add it as null so at least it will be compared.
            foreach (var changedAttribute in changed.Attributes)
            {
                var key = changedAttribute.Key;

                if (!unchanged.Contains(key)) unchanged.Attributes.Add(new KeyValuePair<string, object>(key, null));
            }

            // Loop through each attribute and compare properties
            foreach (var unchangedAttribute in unchanged.Attributes)
            {
                var key = unchangedAttribute.Key;

                var originalAttributeVal = unchanged.Attributes[key];
                var changedAttributeVal = changed.Attributes[key];

                // Fix any original value issues
                if (originalAttributeVal != null)
                {
                    // Fix any zero length strings
                    if (originalAttributeVal is string
                        && string.IsNullOrWhiteSpace((string)originalAttributeVal))
                    {
                        originalAttributeVal = null;
                    }
                    else
                    {
                        // Fix any dates that aren't of a specified kind
                        if (originalAttributeVal is DateTime?)
                        {
                            var date = (DateTime?)originalAttributeVal;
                            if (date.Value.Kind == DateTimeKind.Unspecified) originalAttributeVal = date.Value.ToUniversalTime();
                        }
                    }
                }

                // Fix any changed value issues
                if (changedAttributeVal != null)
                {
                    // Fix any zero length strings
                    if (changedAttributeVal is string
                        && string.IsNullOrWhiteSpace((string)changedAttributeVal))
                    {
                        changedAttributeVal = null;
                    }
                    else
                    {
                        // Fix any dates that aren't of a specified kind
                        if (changedAttributeVal is DateTime?)
                        {
                            var date = (DateTime?)changedAttributeVal;
                            if (date.Value.Kind == DateTimeKind.Unspecified) changedAttributeVal = date.Value.ToUniversalTime();
                        }
                    }
                }

                // Compare the values
                if (originalAttributeVal == null && changedAttributeVal == null)
                {
                    changed.Attributes.Remove(key);
                }
                else if (originalAttributeVal != null && changedAttributeVal == null)
                {
                    // Do nothing, keep the attribute        
                }
                else if (changedAttributeVal is EntityCollection)
                {
                    // Do nothing, Leave it in... (complicated to compare).
                }
                else if (changedAttributeVal.Equals(originalAttributeVal))
                {
                    var guid = unchangedAttribute.Value as Guid?;
                    if (guid != null)
                    {
                        // Avoid removing the key
                        if (!(guid == unchanged.Id))
                        {
                            changed.Attributes.Remove(key);
                        }
                    }
                    else
                    {
                        changed.Attributes.Remove(key);
                    }
                }
            }
        }

        /// <summary>
        /// Take a shallow copy of an entity
        /// </summary>
        /// <param name="entity">The entity that should be cloned</param>
        /// <returns>The shallow copy</returns>
        private static Entity ShallowClone(Entity entity)
        {
            var clone = new Entity(entity.LogicalName) { EntityState = entity.EntityState, Id = entity.Id };

            foreach (var attribute in entity.Attributes)
            {
                if (attribute.Value == null)
                {
                    clone.Attributes.Add(attribute.Key, null);
                }
                else if (attribute.Value is EntityReference)
                {
                    var entityReference = (EntityReference)attribute.Value;
                    clone.Attributes.Add(attribute.Key, new EntityReference(entityReference.LogicalName, entityReference.Id));
                }
                else if (attribute.Value is Money)
                {
                    var money = (Money)attribute.Value;
                    clone.Attributes.Add(attribute.Key, new Money(money.Value));
                }
                else if (attribute.Value is OptionSetValue)
                {
                    var option = (OptionSetValue)attribute.Value;
                    clone.Attributes.Add(attribute.Key, new OptionSetValue(option.Value));
                }
                else if (attribute.Value is EntityCollection)
                {
                    // Don't copy EntityCollection values, just re-reference it.
                    var entityCollection = (EntityCollection)attribute.Value;
                    clone.Attributes.Add(attribute.Key, entityCollection);
                }
                else
                {
                    // value types
                    clone.Attributes.Add(attribute.Key, attribute.Value);
                }
            }

            return clone;
        }
    }
}