namespace DiyStore.Api.Domain;

/// <summary>Modalitatile de livrare oferite pentru un produs; se pot combina.</summary>
[Flags]
public enum DeliveryMethod
{
    None = 0,
    Courier = 1,
    StorePickup = 2
}
