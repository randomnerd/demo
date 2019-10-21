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

SET search_path = public, pg_catalog;

--
-- Data for Name: currencies; Type: TABLE DATA; Schema: public; Owner: randomnerd
--

INSERT INTO currencies VALUES (1, 'Bitcoin', 'BTC', NULL, NULL, NULL, NULL, NULL, NULL, 3, 0, 0.0007, '2017-09-20 15:08:50.432+03', '2017-09-20 15:08:50.432+03', 'https://bitcoin.org');
INSERT INTO currencies VALUES (2, 'Litecoin', 'LTC', NULL, NULL, NULL, NULL, NULL, NULL, 3, 0, 0.0007, '2017-09-20 15:08:50.442+03', '2017-09-20 15:08:50.442+03', 'https://litecoin.org');
INSERT INTO currencies VALUES (3, 'Ethereum', 'ETH', NULL, NULL, NULL, NULL, NULL, NULL, 3, 0, 0.0012, '2017-09-20 15:08:50.45+03', '2017-09-20 15:08:50.45+03', 'https://ethereum.org');
INSERT INTO currencies VALUES (4, 'Ethereum Classic', 'ETC', NULL, NULL, NULL, NULL, NULL, NULL, 3, 0, 0.0012, '2017-09-20 15:08:50.46+03', '2017-09-20 15:08:50.46+03', 'https://ethereumclassic.github.io');
INSERT INTO currencies VALUES (5, 'Sibcoin', 'SIB', NULL, NULL, NULL, NULL, NULL, NULL, 3, 0, 0.0001, '2017-09-20 15:08:50.466+03', '2017-09-20 15:08:50.466+03', 'https://sibcoin.org');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: randomnerd
--

INSERT INTO users VALUES (1, 'admin@example.com', 'admin', NULL, '$2a$10$Jvmp4BKQlxXI9kZmRutn1ODrYPy8wxRGtWnlQti0h8MVa0nF8jLNK', 'hkKw52McUs1OBBQvkeLcC3x0KTliPQYf', 'NZAWG6TFMRUCWKZPOVTEYMRYKI2HQM2N', false, 'admin', '2017-09-20 15:08:50.376+03', '2017-09-20 15:08:50.376+03', NULL, false, false);
INSERT INTO users VALUES (2, 'user1@example.com', 'user1', NULL, '$2a$10$FKVBkR3QOBy0/nN0eFPgTOWtMux9/h.IxjDZ9hdIbtvnUXDQOU6la', 'xt1Qt1tu8TxAt7vIvz3TdBI9PIwUMGGI', 'OEYGWRLWLJGWEL2HJZTHA43VONVTINKO', false, 'user', '2017-09-20 15:08:50.611+03', '2017-09-20 15:08:50.611+03', NULL, false, false);
INSERT INTO users VALUES (3, 'user2@example.com', 'user2', NULL, '$2a$10$9.SSqwaxm0oQ5tAFV8tM7u20lfKwud03GfNGzl1DFyTJNESlO3xzq', 'sFmAhUlewt5laX3pQNlZTLIy7f5zTmKO', 'HFMW6QT2ME3G46KOJJMXIRTPLBYS6SBP', false, 'user', '2017-09-20 15:08:51.335+03', '2017-09-20 15:08:51.335+03', NULL, false, false);


--
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: randomnerd
--

INSERT INTO addresses VALUES (2, 2, 3, '0x48cc0dbb3743b0c6fa10ff8661c1c1b29fa2df61', 'e00c61b83f1551b141f2707ebbc256ebe229c6bc2b88243babd9ac5251d52bb6', 0, NULL, '2017-09-20 15:08:50.622+03', '2017-09-20 15:08:50.622+03');
INSERT INTO addresses VALUES (9, 3, 4, '0xbc4bd9e974b67e7df1e4869e42ba4beb267f1439', 'ade005b1b0246255e1b60c81e79baacf27bb93ab6dd335d55add0c7b4cfd5570', 0, NULL, '2017-09-20 15:08:51.343+03', '2017-09-20 15:08:51.343+03');
INSERT INTO addresses VALUES (3, 2, 2, 'LPwGyzYocPcbjovtt22anpY2CN8muUEHLn', 'T4kT2YJxVqDcMCUo2NLsJhUz8iim8cvi9uhKjiimABrm3WSXQgDt', 0, NULL, '2017-09-20 15:08:50.621+03', '2017-09-20 15:08:50.621+03');
INSERT INTO addresses VALUES (4, 2, 4, '0x82b5f282bae6564a338c20723a23b9fe20fdf042', '3d9fe4e20e91ad186cb7b3975b110c3416ce30bb18c4b4db6ea31d1d2da87342', 0, NULL, '2017-09-20 15:08:50.622+03', '2017-09-20 15:08:50.622+03');
INSERT INTO addresses VALUES (5, 2, 5, 'Sd2KmjTetAsUzA6zTSZ5AjMGWLegsBWcUD', 'Kx6tSs39a9oTkrnocbqSmGbFAfpV8Wz4CtaQ6BTubieAaFqvo6F2', 0, NULL, '2017-09-20 15:08:50.622+03', '2017-09-20 15:08:50.622+03');
INSERT INTO addresses VALUES (6, 3, 1, 'mx2fLRkWvHYKXouTRN6MPxkbnMqYjAxSSn', 'cMpd21dQoPsNGZ1PqtfWJ8YtwNSBXCBjea9yGz76EgCMZ9oNib4y', 0, NULL, '2017-09-20 15:08:51.343+03', '2017-09-20 15:08:51.343+03');
INSERT INTO addresses VALUES (7, 3, 2, 'LTgnuQvsRGZaQ5kTa6hy5hLoLCC8CqMxR4', 'T82MUpmnyw3K8Xhe29aMwVtYZBB4cU21EdtBoLQ4KDuXL636E7J9', 0, NULL, '2017-09-20 15:08:51.343+03', '2017-09-20 15:08:51.343+03');
INSERT INTO addresses VALUES (10, 3, 5, 'Sk91R6R5UsNJs7LmU2kjBy9dMd2NUaxf84', 'L5jeEE6yWEnJw7Keck2Ff3ffPFqA4y5kHYfvanzcSy8KByariGRb', 0, NULL, '2017-09-20 15:08:51.343+03', '2017-09-20 15:08:51.343+03');
INSERT INTO addresses VALUES (1, 2, 1, 'n1Sa5xGCf6pVF4tSGxA6YN2nNxY3bUXW1Y', 'cT71GDigq2xz2bfuPrrrXxyw17J6q1moWUA7iBqLhKzw5VwgxZpN', 0, NULL, '2017-09-20 15:08:50.62+03', '2017-09-20 15:08:50.62+03');
INSERT INTO addresses VALUES (8, 3, 3, '0x5682d6a695aa075759828eae53d7de92c6a4361f', 'abed7bca1fde3876a8925bfba86c702b9a121ec5dae3efabfdbc8b9c84d825b3', 0, NULL, '2017-09-20 15:08:51.343+03', '2017-09-20 15:08:51.343+03');


--
-- Name: addresses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: randomnerd
--

SELECT pg_catalog.setval('addresses_id_seq', 10, true);


--
-- Data for Name: balancechanges; Type: TABLE DATA; Schema: public; Owner: randomnerd
--



--
-- Name: balancechanges_id_seq; Type: SEQUENCE SET; Schema: public; Owner: randomnerd
--

SELECT pg_catalog.setval('balancechanges_id_seq', 1, false);


--
-- Data for Name: balances; Type: TABLE DATA; Schema: public; Owner: randomnerd
--

INSERT INTO balances VALUES (1, 2, 1, 100, 0, '2017-09-20 15:08:51.193+03', '2017-09-20 15:08:51.197+03');
INSERT INTO balances VALUES (2, 2, 2, 100, 0, '2017-09-20 15:08:51.206+03', '2017-09-20 15:08:51.209+03');
INSERT INTO balances VALUES (3, 2, 3, 100, 0, '2017-09-20 15:08:51.215+03', '2017-09-20 15:08:51.217+03');
INSERT INTO balances VALUES (4, 2, 4, 100, 0, '2017-09-20 15:08:51.226+03', '2017-09-20 15:08:51.23+03');
INSERT INTO balances VALUES (5, 2, 5, 100, 0, '2017-09-20 15:08:51.237+03', '2017-09-20 15:08:51.239+03');
INSERT INTO balances VALUES (6, 3, 1, 100, 0, '2017-09-20 15:08:51.925+03', '2017-09-20 15:08:51.929+03');
INSERT INTO balances VALUES (7, 3, 2, 100, 0, '2017-09-20 15:08:51.935+03', '2017-09-20 15:08:51.939+03');
INSERT INTO balances VALUES (8, 3, 3, 100, 0, '2017-09-20 15:08:51.944+03', '2017-09-20 15:08:51.946+03');
INSERT INTO balances VALUES (9, 3, 4, 100, 0, '2017-09-20 15:08:51.952+03', '2017-09-20 15:08:51.954+03');
INSERT INTO balances VALUES (10, 3, 5, 100, 0, '2017-09-20 15:08:51.961+03', '2017-09-20 15:08:51.963+03');


--
-- Name: balances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: randomnerd
--

SELECT pg_catalog.setval('balances_id_seq', 10, true);


--
-- Name: currencies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: randomnerd
--

SELECT pg_catalog.setval('currencies_id_seq', 5, true);


--
-- Data for Name: deposits; Type: TABLE DATA; Schema: public; Owner: randomnerd
--



--
-- Name: deposits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: randomnerd
--

SELECT pg_catalog.setval('deposits_id_seq', 1, false);


--
-- Data for Name: incomes; Type: TABLE DATA; Schema: public; Owner: randomnerd
--



--
-- Name: incomes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: randomnerd
--

SELECT pg_catalog.setval('incomes_id_seq', 1, false);


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: randomnerd
--



--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: randomnerd
--

SELECT pg_catalog.setval('messages_id_seq', 1, false);


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: randomnerd
--



--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: randomnerd
--

SELECT pg_catalog.setval('notifications_id_seq', 1, false);


--
-- Data for Name: tradepairs; Type: TABLE DATA; Schema: public; Owner: randomnerd
--

INSERT INTO tradepairs VALUES (1, 'ltc-btc', 2, 1, 0, 0, 0, '2017-09-20 15:08:50.473+03', '2017-09-20 15:08:50.473+03', 0);
INSERT INTO tradepairs VALUES (2, 'eth-btc', 3, 1, 0, 0, 0, '2017-09-20 15:08:50.481+03', '2017-09-20 15:08:50.481+03', 0);
INSERT INTO tradepairs VALUES (3, 'etc-btc', 4, 1, 0, 0, 0, '2017-09-20 15:08:50.49+03', '2017-09-20 15:08:50.49+03', 0);
INSERT INTO tradepairs VALUES (4, 'etc-eth', 4, 3, 0, 0, 0, '2017-09-20 15:08:50.498+03', '2017-09-20 15:08:50.498+03', 0);
INSERT INTO tradepairs VALUES (5, 'sib-btc', 5, 1, 0, 0, 0, '2017-09-20 15:08:50.507+03', '2017-09-20 15:08:50.507+03', 0);
INSERT INTO tradepairs VALUES (6, 'sib-eth', 5, 3, 0, 0, 0, '2017-09-20 15:08:50.515+03', '2017-09-20 15:08:50.515+03', 0);
INSERT INTO tradepairs VALUES (7, 'sib-ltc', 5, 2, 0, 0, 0, '2017-09-20 15:08:50.521+03', '2017-09-20 15:08:50.521+03', 0);


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: randomnerd
--



--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: randomnerd
--

SELECT pg_catalog.setval('orders_id_seq', 1, false);


--
-- Name: pgmigrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: randomnerd
--

SELECT pg_catalog.setval('pgmigrations_id_seq', 2, true);


--
-- Name: tradepairs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: randomnerd
--

SELECT pg_catalog.setval('tradepairs_id_seq', 7, true);


--
-- Data for Name: trades; Type: TABLE DATA; Schema: public; Owner: randomnerd
--



--
-- Name: trades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: randomnerd
--

SELECT pg_catalog.setval('trades_id_seq', 1, false);


--
-- Data for Name: tradestats; Type: TABLE DATA; Schema: public; Owner: randomnerd
--



--
-- Name: tradestats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: randomnerd
--

SELECT pg_catalog.setval('tradestats_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: randomnerd
--

SELECT pg_catalog.setval('users_id_seq', 3, true);


--
-- PostgreSQL database dump complete
--

