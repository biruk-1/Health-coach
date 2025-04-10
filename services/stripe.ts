import { useStripe } from '@stripe/stripe-react-native';
import { supabase } from '../lib/supabase';

export interface PaymentMethod {
  id: string;
  type: string;
  billingDetails: {
    name: string;
    email: string;
    phone: string;
    address: {
      city: string;
      country: string;
      line1: string;
      line2: string;
      postalCode: string;
      state: string;
    };
  };
  card?: {
    brand: string;
    country: string;
    expMonth: number;
    expYear: number;
    last4: string;
  };
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  clientSecret: string;
}

export interface Subscription {
  id: string;
  status: string;
  current_period_end: number;
  current_period_start: number;
  cancel_at_period_end: boolean;
  product: {
    id: string;
    name: string;
  };
  price: {
    id: string;
    unit_amount: number;
    currency: string;
    recurring: {
      interval: string;
      interval_count: number;
    };
  };
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  prices: Price[];
  metadata?: Record<string, string>;
}

export interface Price {
  id: string;
  product_id: string;
  unit_amount: number;
  currency: string;
  recurring?: {
    interval: string;
    interval_count: number;
  };
  metadata?: Record<string, string>;
}

/**
 * Create a Stripe customer for the given user
 */
export const createCustomer = async (userId: string, email: string, name?: string): Promise<string> => {
  try {
    // First check if customer already exists in our database
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();
    
    if (existingCustomer?.stripe_customer_id) {
      return existingCustomer.stripe_customer_id;
    }
    
    // If no customer exists, create one through our server endpoint
    const response = await fetch('/api/create-customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        email,
        name
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create customer');
    }
    
    const { customerId } = await response.json();
    
    // Save customer ID in our database
    await supabase
      .from('customers')
      .insert({
        user_id: userId,
        stripe_customer_id: customerId,
        email
      });
    
    return customerId;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
};

/**
 * Get active products with their prices
 */
export const getProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        active,
        metadata,
        prices (
          id,
          product_id,
          unit_amount,
          currency,
          recurring:interval_data(interval, interval_count),
          metadata
        )
      `)
      .eq('active', true)
      .order('metadata->order', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data as Product[];
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

/**
 * Get a user's active subscriptions
 */
export const getUserSubscriptions = async (userId: string): Promise<Subscription[]> => {
  try {
    // Get customer ID for the user
    const { data: customerData } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();
    
    if (!customerData?.stripe_customer_id) {
      return [];
    }
    
    // Get subscriptions through our server endpoint
    const response = await fetch(`/api/subscriptions?customerId=${customerData.stripe_customer_id}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch subscriptions');
    }
    
    const { subscriptions } = await response.json();
    return subscriptions;
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    throw error;
  }
};

/**
 * Create a subscription checkout session
 */
export const createSubscription = async (
  userId: string, 
  priceId: string,
  customerId?: string
): Promise<string> => {
  try {
    // Get customer ID if not provided
    let customerIdToUse = customerId;
    
    if (!customerIdToUse) {
      const { data: customerData } = await supabase
        .from('customers')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();
      
      customerIdToUse = customerData?.stripe_customer_id;
    }
    
    // Create subscription through our server endpoint
    const response = await fetch('/api/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        priceId,
        customerId: customerIdToUse
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create subscription');
    }
    
    const { clientSecret } = await response.json();
    return clientSecret;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};

/**
 * Cancel a subscription
 */
export const cancelSubscription = async (subscriptionId: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/cancel-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscriptionId
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel subscription');
    }
    
    return true;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};

/**
 * Create a payment intent for a one-time payment
 */
export const createPaymentIntent = async (
  amount: number, 
  currency: string = 'usd',
  customer?: string
): Promise<string> => {
  try {
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        currency,
        customer
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create payment intent');
    }
    
    const { clientSecret } = await response.json();
    return clientSecret;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

/**
 * Initialize the Stripe SDK
 */
export const initStripe = () => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  
  const initializePaymentSheet = async (
    paymentIntentClientSecret: string,
    ephemeralKey?: string,
    customerId?: string
  ): Promise<boolean> => {
    try {
      const { error } = await initPaymentSheet({
        paymentIntentClientSecret,
        customerId,
        customerEphemeralKeySecret: ephemeralKey,
        merchantDisplayName: 'Health Coach App',
        allowsDelayedPaymentMethods: false,
        style: 'automatic'
      });
      
      if (error) {
        console.error('Error initializing payment sheet:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize payment sheet:', error);
      return false;
    }
  };
  
  const showPaymentSheet = async (): Promise<boolean> => {
    try {
      const { error } = await presentPaymentSheet();
      
      if (error) {
        console.error('Payment sheet error:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to present payment sheet:', error);
      return false;
    }
  };
  
  return {
    initializePaymentSheet,
    showPaymentSheet
  };
};