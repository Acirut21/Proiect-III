using DiyStore.Api.Domain;

namespace DiyStore.Api.Shopping;

/// <summary>Costul de livrare: curier 20 RON, gratuit de la 300 RON; ridicarea din magazin este gratuita.</summary>
public static class ShippingPolicy
{
    public const decimal CourierCost = 20m;
    public const decimal FreeCourierFrom = 300m;

    /// <param name="subtotal">Valoarea produselor, fara livrare.</param>
    public static decimal Cost(DeliveryMethod method, decimal subtotal) =>
        method == DeliveryMethod.Courier && subtotal < FreeCourierFrom ? CourierCost : 0m;
}
