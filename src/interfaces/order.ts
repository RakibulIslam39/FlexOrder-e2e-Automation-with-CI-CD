export interface Product {
    id: number;
    sku: string;
    name: string;
    price: string;
    [key: string]: any; // Allow other WooCommerce product properties
}

export interface Address {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    company: string;
}

export interface BillingAddress extends Address {
    email: string;
    phone: string;
}

export interface ShippingAddress extends Address {}

export interface LineItem {
    product_id: number;
    quantity: number;
    name?: string;
}

export interface OrderData {
    payment_method: string;
    payment_method_title: string;
    set_paid: boolean;
    billing: BillingAddress;
    shipping: ShippingAddress;
    line_items: LineItem[];
    coupon_lines?: Array<{
        code: string;
        discount: string;
    }>;
    discount_total?: string;
    customer_note?: string;
    order_note?: string;
}

export interface CustomerData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    note?: string;
}

export interface AddressData {
    firstName: string;
    lastName: string;
    company: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
}

// Consolidated stored order interface (previously in stored-order.ts)
export interface StoredOrder {
    id: number;
    product_names: string;
    status: string;
    total_items: number;
    product_sku: string;
    total_price: string;
    total_discount: string;
    billing: {
        first_name: string;
        last_name: string;
        address_1: string;
        address_2: string;
        city: string;
        postcode: string;
        country: string;
        company: string;
        state: string;
        email: string;
        phone: string;
    };
    shipping: {
        first_name: string;
        last_name: string;
        address_1: string;
        address_2: string;
        city: string;
        postcode: string;
        country: string;
        company: string;
        state: string;
        email: string;
        phone: string;
    };
    order_date: string;
    payment_method: string;
    transaction_id: string;
    customer_note: string;
    order_placed_by: string;
    order_url: string;
    order_note: string;
    _billing_address_index: string;
    _shipping_address_index: string;
}

export interface WooCommerceOrderResponse {
    id: number;
    status: string;
    date_created: string;
    discount_total: string;
    payment_method: string;
    payment_method_title: string;
    customer_note: string;
    note?: string;
    billing: {
        first_name: string;
        last_name: string;
        address_1: string;
        address_2: string;
        city: string;
        postcode: string;
        country: string;
        company: string;
        state: string;
        email: string;
        phone: string;
    };
    shipping: {
        first_name: string;
        last_name: string;
        address_1: string;
        address_2: string;
        city: string;
        postcode: string;
        country: string;
        company: string;
        state: string;
        email: string;
        phone: string;
    };
    line_items: Array<{
        name: string;
        quantity: number;
        total: string;
        sku?: string;
    }>;
}
