--
-- PostgreSQL database dump
--

-- Dumped from database version 9.6.4
-- Dumped by pg_dump version 9.6.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

--
-- Name: enum_notifications_icon; Type: TYPE; Schema: public; Owner: randomnerd
--

CREATE TYPE enum_notifications_icon AS ENUM (
    'info',
    'notice',
    'warning',
    'error'
);


--
-- Name: enum_orders_type; Type: TYPE; Schema: public; Owner: randomnerd
--

CREATE TYPE enum_orders_type AS ENUM (
    'buy',
    'sell'
);


--
-- Name: enum_users_role; Type: TYPE; Schema: public; Owner: randomnerd
--

CREATE TYPE enum_users_role AS ENUM (
    'user',
    'admin'
);



SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: addresses; Type: TABLE; Schema: public; Owner: randomnerd
--

CREATE TABLE addresses (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "currencyId" integer NOT NULL,
    pubkey character varying(255),
    privkey character varying(255),
    received numeric DEFAULT 0,
    lasttx character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);



--
-- Name: addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: randomnerd
--

CREATE SEQUENCE addresses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: randomnerd
--

ALTER SEQUENCE addresses_id_seq OWNED BY addresses.id;


--
-- Name: balancechanges; Type: TABLE; Schema: public; Owner: randomnerd
--

CREATE TABLE balancechanges (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "currencyId" integer NOT NULL,
    "subjectId" integer NOT NULL,
    "subjectType" character varying(255) NOT NULL,
    change numeric NOT NULL,
    total numeric NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);



--
-- Name: balancechanges_id_seq; Type: SEQUENCE; Schema: public; Owner: randomnerd
--

CREATE SEQUENCE balancechanges_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: balancechanges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: randomnerd
--

ALTER SEQUENCE balancechanges_id_seq OWNED BY balancechanges.id;


--
-- Name: balances; Type: TABLE; Schema: public; Owner: randomnerd
--

CREATE TABLE balances (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "currencyId" integer NOT NULL,
    amount numeric DEFAULT 0,
    held numeric DEFAULT 0,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);



--
-- Name: balances_id_seq; Type: SEQUENCE; Schema: public; Owner: randomnerd
--

CREATE SEQUENCE balances_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: balances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: randomnerd
--

ALTER SEQUENCE balances_id_seq OWNED BY balances.id;


--
-- Name: currencies; Type: TABLE; Schema: public; Owner: randomnerd
--

CREATE TABLE currencies (
    id integer NOT NULL,
    name character varying(255),
    short character varying(255),
    host character varying(255),
    port integer,
    "hotAddress" character varying(255),
    username character varying(255),
    password character varying(255),
    "hotSecret" character varying(255),
    "numConf" integer DEFAULT 3,
    height integer DEFAULT 0,
    "withdrawalFee" numeric DEFAULT 0.001,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    href character varying(255)
);



--
-- Name: currencies_id_seq; Type: SEQUENCE; Schema: public; Owner: randomnerd
--

CREATE SEQUENCE currencies_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: currencies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: randomnerd
--

ALTER SEQUENCE currencies_id_seq OWNED BY currencies.id;


--
-- Name: deposits; Type: TABLE; Schema: public; Owner: randomnerd
--

CREATE TABLE deposits (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "currencyId" integer NOT NULL,
    "addressId" integer NOT NULL,
    address character varying(255) NOT NULL,
    hash character varying(255) NOT NULL,
    vout integer,
    "blockHash" character varying(255) NOT NULL,
    "blockNum" integer NOT NULL,
    confirmations integer DEFAULT 1,
    confirmed boolean DEFAULT false,
    amount numeric NOT NULL,
    moved boolean DEFAULT false,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);



--
-- Name: deposits_id_seq; Type: SEQUENCE; Schema: public; Owner: randomnerd
--

CREATE SEQUENCE deposits_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: deposits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: randomnerd
--

ALTER SEQUENCE deposits_id_seq OWNED BY deposits.id;


--
-- Name: incomes; Type: TABLE; Schema: public; Owner: randomnerd
--

CREATE TABLE incomes (
    id integer NOT NULL,
    "currencyId" integer NOT NULL,
    amount numeric DEFAULT 0,
    "subjectId" integer NOT NULL,
    "subjectType" character varying(255) NOT NULL,
    ack boolean DEFAULT false NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);



--
-- Name: incomes_id_seq; Type: SEQUENCE; Schema: public; Owner: randomnerd
--

CREATE SEQUENCE incomes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: incomes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: randomnerd
--

ALTER SEQUENCE incomes_id_seq OWNED BY incomes.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: randomnerd
--

CREATE TABLE messages (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "dstUserId" integer,
    text text NOT NULL,
    username character varying(255),
    "dstUserName" character varying(255),
    "isPrivate" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);



--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: randomnerd
--

CREATE SEQUENCE messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: randomnerd
--

ALTER SEQUENCE messages_id_seq OWNED BY messages.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: randomnerd
--

CREATE TABLE notifications (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    title character varying(255),
    body text,
    icon enum_notifications_icon DEFAULT 'info'::enum_notifications_icon NOT NULL,
    ack boolean DEFAULT false NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);



--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: randomnerd
--

CREATE SEQUENCE notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: randomnerd
--

ALTER SEQUENCE notifications_id_seq OWNED BY notifications.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: randomnerd
--

CREATE TABLE orders (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "tradePairId" integer NOT NULL,
    type enum_orders_type NOT NULL,
    amount numeric NOT NULL,
    price numeric NOT NULL,
    remain numeric,
    complete boolean DEFAULT false,
    canceled boolean DEFAULT false,
    fee numeric DEFAULT 0,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);



--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: randomnerd
--

CREATE SEQUENCE orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: randomnerd
--

ALTER SEQUENCE orders_id_seq OWNED BY orders.id;


--
-- Name: tradepairs; Type: TABLE; Schema: public; Owner: randomnerd
--

CREATE TABLE tradepairs (
    id integer NOT NULL,
    permalink character varying(255),
    "srcCurrencyId" integer NOT NULL,
    "dstCurrencyId" integer NOT NULL,
    fee numeric DEFAULT 0,
    "lastPrice" numeric DEFAULT 0,
    volume numeric DEFAULT 0,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    delta integer
);



--
-- Name: tradepairs_id_seq; Type: SEQUENCE; Schema: public; Owner: randomnerd
--

CREATE SEQUENCE tradepairs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: tradepairs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: randomnerd
--

ALTER SEQUENCE tradepairs_id_seq OWNED BY tradepairs.id;


--
-- Name: trades; Type: TABLE; Schema: public; Owner: randomnerd
--

CREATE TABLE trades (
    id integer NOT NULL,
    "srcUserId" integer NOT NULL,
    "dstUserId" integer NOT NULL,
    "tradePairId" integer NOT NULL,
    "srcOrderId" integer NOT NULL,
    "dstOrderId" integer NOT NULL,
    amount numeric NOT NULL,
    price numeric NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);



--
-- Name: trades_id_seq; Type: SEQUENCE; Schema: public; Owner: randomnerd
--

CREATE SEQUENCE trades_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: trades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: randomnerd
--

ALTER SEQUENCE trades_id_seq OWNED BY trades.id;


--
-- Name: tradestats; Type: TABLE; Schema: public; Owner: randomnerd
--

CREATE TABLE tradestats (
    id integer NOT NULL,
    "pairId" integer NOT NULL,
    open numeric DEFAULT 0,
    high numeric DEFAULT 0,
    low numeric DEFAULT 0,
    close numeric DEFAULT 0,
    volume numeric DEFAULT 0,
    ts integer NOT NULL
);



--
-- Name: tradestats_id_seq; Type: SEQUENCE; Schema: public; Owner: randomnerd
--

CREATE SEQUENCE tradestats_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: tradestats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: randomnerd
--

ALTER SEQUENCE tradestats_id_seq OWNED BY tradestats.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: randomnerd
--

CREATE TABLE users (
    id integer NOT NULL,
    email character varying(255),
    username character varying(255),
    realname character varying(255),
    password character varying(255),
    "emailCode" character varying(255),
    "otpSecret" character varying(255),
    "otpEnabled" boolean DEFAULT false,
    role enum_users_role DEFAULT 'user'::enum_users_role,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "passwordCode" character varying(255),
    banned boolean DEFAULT false,
    "chatBanned" boolean DEFAULT false
);



--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: randomnerd
--

CREATE SEQUENCE users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: randomnerd
--

ALTER SEQUENCE users_id_seq OWNED BY users.id;


--
-- Name: addresses id; Type: DEFAULT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY addresses ALTER COLUMN id SET DEFAULT nextval('addresses_id_seq'::regclass);


--
-- Name: balancechanges id; Type: DEFAULT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY balancechanges ALTER COLUMN id SET DEFAULT nextval('balancechanges_id_seq'::regclass);


--
-- Name: balances id; Type: DEFAULT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY balances ALTER COLUMN id SET DEFAULT nextval('balances_id_seq'::regclass);


--
-- Name: currencies id; Type: DEFAULT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY currencies ALTER COLUMN id SET DEFAULT nextval('currencies_id_seq'::regclass);


--
-- Name: deposits id; Type: DEFAULT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY deposits ALTER COLUMN id SET DEFAULT nextval('deposits_id_seq'::regclass);


--
-- Name: incomes id; Type: DEFAULT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY incomes ALTER COLUMN id SET DEFAULT nextval('incomes_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY messages ALTER COLUMN id SET DEFAULT nextval('messages_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY notifications ALTER COLUMN id SET DEFAULT nextval('notifications_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY orders ALTER COLUMN id SET DEFAULT nextval('orders_id_seq'::regclass);


--
-- Name: tradepairs id; Type: DEFAULT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY tradepairs ALTER COLUMN id SET DEFAULT nextval('tradepairs_id_seq'::regclass);


--
-- Name: trades id; Type: DEFAULT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY trades ALTER COLUMN id SET DEFAULT nextval('trades_id_seq'::regclass);


--
-- Name: tradestats id; Type: DEFAULT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY tradestats ALTER COLUMN id SET DEFAULT nextval('tradestats_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY users ALTER COLUMN id SET DEFAULT nextval('users_id_seq'::regclass);


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: addresses addresses_privkey_key; Type: CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY addresses
    ADD CONSTRAINT addresses_privkey_key UNIQUE (privkey);


--
-- Name: addresses addresses_pubkey_key; Type: CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY addresses
    ADD CONSTRAINT addresses_pubkey_key UNIQUE (pubkey);


--
-- Name: balancechanges balancechanges_pkey; Type: CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY balancechanges
    ADD CONSTRAINT balancechanges_pkey PRIMARY KEY (id);


--
-- Name: balances balances_pkey; Type: CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY balances
    ADD CONSTRAINT balances_pkey PRIMARY KEY (id);


--
-- Name: currencies currencies_name_key; Type: CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY currencies
    ADD CONSTRAINT currencies_name_key UNIQUE (name);


--
-- Name: currencies currencies_pkey; Type: CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY currencies
    ADD CONSTRAINT currencies_pkey PRIMARY KEY (id);


--
-- Name: currencies currencies_short_key; Type: CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY currencies
    ADD CONSTRAINT currencies_short_key UNIQUE (short);


--
-- Name: deposits deposits_pkey; Type: CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY deposits
    ADD CONSTRAINT deposits_pkey PRIMARY KEY (id);


--
-- Name: users email_unique_idx; Type: CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY users
    ADD CONSTRAINT email_unique_idx UNIQUE (email);


--
-- Name: incomes incomes_pkey; Type: CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY incomes
    ADD CONSTRAINT incomes_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: currencies name_unique_idx; Type: CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY currencies
    ADD CONSTRAINT name_unique_idx UNIQUE (name);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: tradepairs tradepairs_permalink_key; Type: CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY tradepairs
    ADD CONSTRAINT tradepairs_permalink_key UNIQUE (permalink);


--
-- Name: tradepairs tradepairs_pkey; Type: CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY tradepairs
    ADD CONSTRAINT tradepairs_pkey PRIMARY KEY (id);


--
-- Name: trades trades_pkey; Type: CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY trades
    ADD CONSTRAINT trades_pkey PRIMARY KEY (id);


--
-- Name: tradestats tradestats_pkey; Type: CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY tradestats
    ADD CONSTRAINT tradestats_pkey PRIMARY KEY (id);


--
-- Name: users username_unique_idx; Type: CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY users
    ADD CONSTRAINT username_unique_idx UNIQUE (username);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: addresses_currency_id_pubkey; Type: INDEX; Schema: public; Owner: randomnerd
--

CREATE UNIQUE INDEX addresses_currency_id_pubkey ON addresses USING btree ("currencyId", pubkey);


--
-- Name: addresses_user_id_currency_id; Type: INDEX; Schema: public; Owner: randomnerd
--

CREATE INDEX addresses_user_id_currency_id ON addresses USING btree ("userId", "currencyId");


--
-- Name: balancechanges_subject_type_subject_id; Type: INDEX; Schema: public; Owner: randomnerd
--

CREATE INDEX balancechanges_subject_type_subject_id ON balancechanges USING btree ("subjectType", "subjectId");


--
-- Name: balancechanges_user_id_currency_id; Type: INDEX; Schema: public; Owner: randomnerd
--

CREATE INDEX balancechanges_user_id_currency_id ON balancechanges USING btree ("userId", "currencyId");


--
-- Name: balances_user_id_currency_id; Type: INDEX; Schema: public; Owner: randomnerd
--

CREATE UNIQUE INDEX balances_user_id_currency_id ON balances USING btree ("userId", "currencyId");


--
-- Name: deposits_hash_block_hash_block_num_confirmations_confirmed; Type: INDEX; Schema: public; Owner: randomnerd
--

CREATE INDEX deposits_hash_block_hash_block_num_confirmations_confirmed ON deposits USING btree (hash, "blockHash", "blockNum", confirmations, confirmed);


--
-- Name: deposits_user_id_currency_id_address_id_address_moved; Type: INDEX; Schema: public; Owner: randomnerd
--

CREATE INDEX deposits_user_id_currency_id_address_id_address_moved ON deposits USING btree ("userId", "currencyId", "addressId", address, moved);


--
-- Name: incomes_currency_id_ack; Type: INDEX; Schema: public; Owner: randomnerd
--

CREATE INDEX incomes_currency_id_ack ON incomes USING btree ("currencyId", ack);


--
-- Name: incomes_subject_id_subject_type; Type: INDEX; Schema: public; Owner: randomnerd
--

CREATE INDEX incomes_subject_id_subject_type ON incomes USING btree ("subjectId", "subjectType");


--
-- Name: messages_user_id_dst_user_id_is_private; Type: INDEX; Schema: public; Owner: randomnerd
--

CREATE INDEX messages_user_id_dst_user_id_is_private ON messages USING btree ("userId", "dstUserId", "isPrivate");


--
-- Name: notifications_user_id_ack; Type: INDEX; Schema: public; Owner: randomnerd
--

CREATE INDEX notifications_user_id_ack ON notifications USING btree ("userId", ack);


--
-- Name: orders_trade_pair_id_complete_canceled; Type: INDEX; Schema: public; Owner: randomnerd
--

CREATE INDEX orders_trade_pair_id_complete_canceled ON orders USING btree ("tradePairId", complete, canceled);


--
-- Name: orders_type_price; Type: INDEX; Schema: public; Owner: randomnerd
--

CREATE INDEX orders_type_price ON orders USING btree (type, price);


--
-- Name: trades_src_order_id_dst_order_id; Type: INDEX; Schema: public; Owner: randomnerd
--

CREATE INDEX trades_src_order_id_dst_order_id ON trades USING btree ("srcOrderId", "dstOrderId");


--
-- Name: trades_src_user_id_dst_user_id; Type: INDEX; Schema: public; Owner: randomnerd
--

CREATE INDEX trades_src_user_id_dst_user_id ON trades USING btree ("srcUserId", "dstUserId");


--
-- Name: trades_trade_pair_id; Type: INDEX; Schema: public; Owner: randomnerd
--

CREATE INDEX trades_trade_pair_id ON trades USING btree ("tradePairId");


--
-- Name: tradestats_pair_id_ts; Type: INDEX; Schema: public; Owner: randomnerd
--

CREATE INDEX tradestats_pair_id_ts ON tradestats USING btree ("pairId", ts);


--
-- Name: users_email; Type: INDEX; Schema: public; Owner: randomnerd
--

CREATE UNIQUE INDEX users_email ON users USING btree (email);


--
-- Name: users_email_code; Type: INDEX; Schema: public; Owner: randomnerd
--

CREATE INDEX users_email_code ON users USING btree ("emailCode");


--
-- Name: users_password_code; Type: INDEX; Schema: public; Owner: randomnerd
--

CREATE INDEX users_password_code ON users USING btree ("passwordCode");


--
-- Name: users_role; Type: INDEX; Schema: public; Owner: randomnerd
--

CREATE INDEX users_role ON users USING btree (role);


--
-- Name: users_username; Type: INDEX; Schema: public; Owner: randomnerd
--

CREATE UNIQUE INDEX users_username ON users USING btree (username);


--
-- Name: addresses addresses_currencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY addresses
    ADD CONSTRAINT "addresses_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES currencies(id) ON UPDATE CASCADE;


--
-- Name: addresses addresses_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY addresses
    ADD CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: balancechanges balancechanges_currencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY balancechanges
    ADD CONSTRAINT "balancechanges_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES currencies(id);


--
-- Name: balancechanges balancechanges_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY balancechanges
    ADD CONSTRAINT "balancechanges_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id);


--
-- Name: balances balances_currencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY balances
    ADD CONSTRAINT "balances_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES currencies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: balances balances_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY balances
    ADD CONSTRAINT "balances_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: deposits deposits_addressId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY deposits
    ADD CONSTRAINT "deposits_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES addresses(id);


--
-- Name: deposits deposits_currencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY deposits
    ADD CONSTRAINT "deposits_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES currencies(id);


--
-- Name: deposits deposits_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY deposits
    ADD CONSTRAINT "deposits_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id);


--
-- Name: incomes incomes_currencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY incomes
    ADD CONSTRAINT "incomes_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES currencies(id);


--
-- Name: messages messages_dstUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY messages
    ADD CONSTRAINT "messages_dstUserId_fkey" FOREIGN KEY ("dstUserId") REFERENCES users(id);


--
-- Name: messages messages_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY messages
    ADD CONSTRAINT "messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: orders orders_tradePairId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY orders
    ADD CONSTRAINT "orders_tradePairId_fkey" FOREIGN KEY ("tradePairId") REFERENCES tradepairs(id);


--
-- Name: orders orders_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY orders
    ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tradepairs tradepairs_dstCurrencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY tradepairs
    ADD CONSTRAINT "tradepairs_dstCurrencyId_fkey" FOREIGN KEY ("dstCurrencyId") REFERENCES currencies(id);


--
-- Name: tradepairs tradepairs_srcCurrencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY tradepairs
    ADD CONSTRAINT "tradepairs_srcCurrencyId_fkey" FOREIGN KEY ("srcCurrencyId") REFERENCES currencies(id);


--
-- Name: trades trades_dstOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY trades
    ADD CONSTRAINT "trades_dstOrderId_fkey" FOREIGN KEY ("dstOrderId") REFERENCES orders(id);


--
-- Name: trades trades_dstUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY trades
    ADD CONSTRAINT "trades_dstUserId_fkey" FOREIGN KEY ("dstUserId") REFERENCES users(id);


--
-- Name: trades trades_srcOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY trades
    ADD CONSTRAINT "trades_srcOrderId_fkey" FOREIGN KEY ("srcOrderId") REFERENCES orders(id);


--
-- Name: trades trades_srcUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY trades
    ADD CONSTRAINT "trades_srcUserId_fkey" FOREIGN KEY ("srcUserId") REFERENCES users(id);


--
-- Name: trades trades_tradePairId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY trades
    ADD CONSTRAINT "trades_tradePairId_fkey" FOREIGN KEY ("tradePairId") REFERENCES tradepairs(id);


--
-- Name: tradestats tradestats_pairId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: randomnerd
--

ALTER TABLE ONLY tradestats
    ADD CONSTRAINT "tradestats_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES tradepairs(id);


--
-- PostgreSQL database dump complete
--

