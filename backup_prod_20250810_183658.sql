--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: equipment_submission_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.equipment_submission_status AS ENUM (
    'pending',
    'under_review',
    'approved',
    'declined',
    'scheduled',
    'completed',
    'cancelled'
);


--
-- Name: order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_status AS ENUM (
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
);


--
-- Name: product_condition; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.product_condition AS ENUM (
    'new',
    'like_new',
    'good',
    'fair',
    'needs_repair'
);


--
-- Name: product_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.product_status AS ENUM (
    'active',
    'inactive',
    'sold',
    'pending',
    'draft',
    'archived'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'user',
    'developer'
);


--
-- Name: update_product_search_vector(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_product_search_vector() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        NEW.search_vector := 
          setweight(to_tsvector('english', coalesce(NEW.name,'')), 'A') ||
          setweight(to_tsvector('english', coalesce(NEW.description,'')), 'B') ||
          setweight(to_tsvector('english', coalesce(NEW.brand,'')), 'C');
        RETURN NEW;
      END;
      $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    event_type character varying NOT NULL,
    user_id character varying,
    session_id character varying,
    action character varying,
    page character varying,
    page_url character varying,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.addresses (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    type character varying NOT NULL,
    first_name character varying NOT NULL,
    last_name character varying NOT NULL,
    street character varying NOT NULL,
    city character varying NOT NULL,
    state character varying NOT NULL,
    zip_code character varying NOT NULL,
    country character varying DEFAULT 'US'::character varying,
    is_default boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    session_id character varying,
    product_id character varying,
    quantity integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    slug character varying NOT NULL,
    image_url text,
    description text,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    product_count integer DEFAULT 0,
    filter_config jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: coupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupons (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    code character varying NOT NULL,
    description text NOT NULL,
    discount_type character varying NOT NULL,
    discount_value numeric(10,2) NOT NULL,
    min_order_amount numeric(10,2),
    max_discount numeric(10,2),
    usage_limit integer,
    usage_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    valid_from timestamp without time zone DEFAULT now(),
    valid_until timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: email_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    to_email character varying NOT NULL,
    from_email character varying NOT NULL,
    subject character varying NOT NULL,
    template_type character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying,
    sent_at timestamp without time zone,
    error text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: email_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_queue (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    to_email character varying NOT NULL,
    template character varying NOT NULL,
    data jsonb,
    status character varying DEFAULT 'pending'::character varying,
    sent_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: equipment_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipment_submissions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    name character varying NOT NULL,
    brand character varying,
    category character varying NOT NULL,
    condition character varying NOT NULL,
    description text NOT NULL,
    images text[] DEFAULT '{}'::text[],
    asking_price numeric(10,2),
    weight integer,
    dimensions text,
    year_purchased integer,
    original_price numeric(10,2),
    seller_email character varying NOT NULL,
    seller_phone character varying,
    seller_location text,
    is_local_pickup boolean DEFAULT false,
    notes text,
    status character varying DEFAULT 'pending'::character varying,
    admin_notes text,
    offered_price numeric(10,2),
    reference_number character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: newsletter_subscribers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.newsletter_subscribers (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying NOT NULL,
    subscribed boolean DEFAULT true,
    unsubscribe_token character varying,
    subscribed_at timestamp without time zone DEFAULT now(),
    unsubscribed_at timestamp without time zone
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying,
    product_id character varying,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: order_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_tracking (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying NOT NULL,
    status character varying NOT NULL,
    location character varying,
    description text,
    tracking_number character varying,
    carrier character varying,
    estimated_delivery timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    status public.order_status DEFAULT 'pending'::public.order_status,
    subtotal numeric(10,2) NOT NULL,
    tax_amount numeric(10,2) DEFAULT '0'::numeric,
    shipping_cost numeric(10,2) DEFAULT '0'::numeric,
    total numeric(10,2) NOT NULL,
    stripe_payment_intent_id character varying,
    shipping_address_id character varying,
    billing_address_id character varying,
    notes text,
    tracking_number character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    ip_address character varying(45),
    user_agent text
);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    category_id character varying,
    subcategory text,
    brand character varying,
    weight integer,
    condition public.product_condition NOT NULL,
    status public.product_status DEFAULT 'active'::public.product_status,
    images jsonb DEFAULT '[]'::jsonb,
    specifications jsonb DEFAULT '{}'::jsonb,
    stock_quantity integer DEFAULT 1,
    views integer DEFAULT 0,
    featured boolean DEFAULT false,
    search_vector tsvector,
    stripe_product_id character varying,
    stripe_price_id character varying,
    stripe_sync_status character varying(50) DEFAULT 'pending'::character varying,
    stripe_last_sync timestamp without time zone,
    sku character varying,
    dimensions jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: return_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.return_requests (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying NOT NULL,
    user_id character varying NOT NULL,
    reason character varying NOT NULL,
    description text,
    preferred_resolution character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying,
    return_number character varying NOT NULL,
    images jsonb DEFAULT '[]'::jsonb,
    admin_notes text,
    refund_amount numeric(10,2),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    product_id character varying NOT NULL,
    user_id character varying NOT NULL,
    rating integer NOT NULL,
    title character varying NOT NULL,
    content text NOT NULL,
    verified boolean DEFAULT false,
    helpful integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


--
-- Name: user_email_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_email_preferences (
    user_id character varying NOT NULL,
    order_updates boolean DEFAULT true,
    marketing boolean DEFAULT true,
    price_alerts boolean DEFAULT true,
    newsletter boolean DEFAULT true,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: user_onboarding; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_onboarding (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    address_completed boolean DEFAULT false,
    phone_completed boolean DEFAULT false,
    preferences_completed boolean DEFAULT false,
    stripe_customer_created boolean DEFAULT false,
    welcome_email_sent boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying NOT NULL,
    password character varying,
    first_name character varying NOT NULL,
    last_name character varying NOT NULL,
    phone character varying,
    street character varying(255),
    city character varying(100),
    state character varying(2),
    zip_code character varying(10),
    latitude numeric(10,8),
    longitude numeric(11,8),
    stripe_customer_id character varying,
    stripe_subscription_id character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    role public.user_role DEFAULT 'user'::public.user_role,
    google_id character varying,
    profile_image_url text,
    auth_provider character varying DEFAULT 'local'::character varying,
    is_email_verified boolean DEFAULT false,
    google_email character varying,
    google_picture text,
    profile_complete boolean DEFAULT false,
    onboarding_step integer DEFAULT 0,
    is_local_customer boolean DEFAULT false
);


--
-- Name: wishlists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wishlists (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    product_id character varying,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_unique UNIQUE (slug);


--
-- Name: coupons coupons_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_unique UNIQUE (code);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: email_logs email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_pkey PRIMARY KEY (id);


--
-- Name: email_queue email_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_queue
    ADD CONSTRAINT email_queue_pkey PRIMARY KEY (id);


--
-- Name: equipment_submissions equipment_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_submissions
    ADD CONSTRAINT equipment_submissions_pkey PRIMARY KEY (id);


--
-- Name: equipment_submissions equipment_submissions_reference_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_submissions
    ADD CONSTRAINT equipment_submissions_reference_number_unique UNIQUE (reference_number);


--
-- Name: newsletter_subscribers newsletter_subscribers_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_email_unique UNIQUE (email);


--
-- Name: newsletter_subscribers newsletter_subscribers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id);


--
-- Name: newsletter_subscribers newsletter_subscribers_unsubscribe_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_unsubscribe_token_unique UNIQUE (unsubscribe_token);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: order_tracking order_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_tracking
    ADD CONSTRAINT order_tracking_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_unique UNIQUE (token);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: return_requests return_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.return_requests
    ADD CONSTRAINT return_requests_pkey PRIMARY KEY (id);


--
-- Name: return_requests return_requests_return_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.return_requests
    ADD CONSTRAINT return_requests_return_number_unique UNIQUE (return_number);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: user_email_preferences user_email_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_email_preferences
    ADD CONSTRAINT user_email_preferences_pkey PRIMARY KEY (user_id);


--
-- Name: user_onboarding user_onboarding_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_onboarding
    ADD CONSTRAINT user_onboarding_pkey PRIMARY KEY (id);


--
-- Name: user_onboarding user_onboarding_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_onboarding
    ADD CONSTRAINT user_onboarding_user_id_unique UNIQUE (user_id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_google_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_unique UNIQUE (google_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wishlists wishlists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: idx_activity_logs_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_logs_created ON public.activity_logs USING btree (created_at);


--
-- Name: idx_activity_logs_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_logs_type ON public.activity_logs USING btree (event_type);


--
-- Name: idx_coupons_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coupons_active ON public.coupons USING btree (is_active);


--
-- Name: idx_coupons_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coupons_code ON public.coupons USING btree (code);


--
-- Name: idx_email_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_created_at ON public.email_logs USING btree (created_at);


--
-- Name: idx_email_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_status ON public.email_logs USING btree (status);


--
-- Name: idx_email_logs_to_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_to_email ON public.email_logs USING btree (to_email);


--
-- Name: idx_email_queue_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_queue_created_at ON public.email_queue USING btree (created_at);


--
-- Name: idx_email_queue_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_queue_status ON public.email_queue USING btree (status);


--
-- Name: idx_newsletter_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_newsletter_email ON public.newsletter_subscribers USING btree (email);


--
-- Name: idx_newsletter_subscribed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_newsletter_subscribed ON public.newsletter_subscribers USING btree (subscribed);


--
-- Name: idx_order_tracking_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_tracking_order ON public.order_tracking USING btree (order_id);


--
-- Name: idx_order_tracking_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_tracking_status ON public.order_tracking USING btree (status);


--
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_category ON public.products USING btree (category_id);


--
-- Name: idx_products_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_created_at ON public.products USING btree (created_at);


--
-- Name: idx_products_featured; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_featured ON public.products USING btree (featured);


--
-- Name: idx_products_price; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_price ON public.products USING btree (price);


--
-- Name: idx_products_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_search ON public.products USING gin (search_vector);


--
-- Name: idx_products_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_status ON public.products USING btree (status);


--
-- Name: idx_prt_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prt_expires ON public.password_reset_tokens USING btree (expires_at);


--
-- Name: idx_prt_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prt_token ON public.password_reset_tokens USING btree (token);


--
-- Name: idx_prt_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prt_user_id ON public.password_reset_tokens USING btree (user_id);


--
-- Name: idx_return_requests_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_return_requests_order ON public.return_requests USING btree (order_id);


--
-- Name: idx_return_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_return_requests_status ON public.return_requests USING btree (status);


--
-- Name: idx_return_requests_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_return_requests_user ON public.return_requests USING btree (user_id);


--
-- Name: idx_reviews_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_product ON public.reviews USING btree (product_id);


--
-- Name: idx_reviews_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_rating ON public.reviews USING btree (rating);


--
-- Name: idx_reviews_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_user ON public.reviews USING btree (user_id);


--
-- Name: idx_stripe_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stripe_product_id ON public.products USING btree (stripe_product_id);


--
-- Name: idx_stripe_sync_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stripe_sync_status ON public.products USING btree (stripe_sync_status);


--
-- Name: idx_submissions_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_category ON public.equipment_submissions USING btree (category);


--
-- Name: idx_submissions_reference; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_reference ON public.equipment_submissions USING btree (reference_number);


--
-- Name: idx_submissions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_status ON public.equipment_submissions USING btree (status);


--
-- Name: idx_submissions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_user ON public.equipment_submissions USING btree (user_id);


--
-- Name: idx_wishlists_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wishlists_product ON public.wishlists USING btree (product_id);


--
-- Name: idx_wishlists_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wishlists_user ON public.wishlists USING btree (user_id);


--
-- Name: products trigger_update_product_search_vector; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_product_search_vector BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_product_search_vector();


--
-- Name: activity_logs activity_logs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: addresses addresses_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: cart_items cart_items_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: cart_items cart_items_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: equipment_submissions equipment_submissions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_submissions
    ADD CONSTRAINT equipment_submissions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: order_items order_items_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: order_tracking order_tracking_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_tracking
    ADD CONSTRAINT order_tracking_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: orders orders_billing_address_id_addresses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_billing_address_id_addresses_id_fk FOREIGN KEY (billing_address_id) REFERENCES public.addresses(id);


--
-- Name: orders orders_shipping_address_id_addresses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_shipping_address_id_addresses_id_fk FOREIGN KEY (shipping_address_id) REFERENCES public.addresses(id);


--
-- Name: orders orders_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: password_reset_tokens password_reset_tokens_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: products products_category_id_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: return_requests return_requests_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.return_requests
    ADD CONSTRAINT return_requests_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: return_requests return_requests_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.return_requests
    ADD CONSTRAINT return_requests_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_email_preferences user_email_preferences_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_email_preferences
    ADD CONSTRAINT user_email_preferences_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_onboarding user_onboarding_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_onboarding
    ADD CONSTRAINT user_onboarding_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: wishlists wishlists_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: wishlists wishlists_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

