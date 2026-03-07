-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 07-03-2026 a las 01:11:25
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `adminbusiness`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `activos`
--

CREATE TABLE `activos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `id_categoria` int(11) DEFAULT NULL,
  `id_negocio` int(11) DEFAULT NULL,
  `fecha_compra` date DEFAULT NULL,
  `valor_compra` decimal(14,2) NOT NULL DEFAULT 0.00,
  `valor_actual` decimal(14,2) DEFAULT 0.00,
  `vida_util_meses` int(11) DEFAULT 0,
  `depreciacion_mensual` decimal(14,2) GENERATED ALWAYS AS (case when `vida_util_meses` > 0 then `valor_compra` / `vida_util_meses` else 0 end) STORED,
  `estado` enum('BUENO','REGULAR','MALO','DADO DE BAJA') DEFAULT 'BUENO',
  `ubicacion` varchar(150) DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `app_modulos`
--

CREATE TABLE `app_modulos` (
  `id` int(11) NOT NULL,
  `url` varchar(50) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `icono` varchar(100) DEFAULT NULL,
  `orden` int(11) DEFAULT 1,
  `activo` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `app_modulos`
--

INSERT INTO `app_modulos` (`id`, `url`, `nombre`, `icono`, `orden`, `activo`) VALUES
(1, 'usuarios', 'Usuarios', 'PersonIcon', 2, 1),
(2, 'negocios', 'Negocios', 'StoreIcon', 1, 1),
(3, 'ventas', 'ventas', 'PointOfSaleIcon ', 4, 1),
(4, 'categorias', 'categorias', 'Inventory2Icon', 3, 1),
(5, 'inventariofisico', 'Inventario Fisico', 'Inventory2Icon', 5, 1),
(6, 'activos', 'Activos', 'BusinessCenterIcon', 6, 1),
(7, 'cajero', 'cajero', 'cajero', 10, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `app_modulos_negocio`
--

CREATE TABLE `app_modulos_negocio` (
  `id` int(11) NOT NULL,
  `id_negocio` int(11) NOT NULL,
  `id_modulo` int(11) NOT NULL,
  `activo` tinyint(4) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `app_modulos_negocio`
--

INSERT INTO `app_modulos_negocio` (`id`, `id_negocio`, `id_modulo`, `activo`) VALUES
(1, 1, 1, 1),
(2, 1, 2, 1),
(4, 1, 4, 1),
(5, 1, 5, 1),
(6, 1, 6, 1),
(7, 1, 3, 1),
(8, 1, 7, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `app_modulos_negocio_rol`
--

CREATE TABLE `app_modulos_negocio_rol` (
  `id` int(11) NOT NULL,
  `id_app_modulos_negocio` int(11) NOT NULL,
  `rol` enum('admin','cliente','empleado') NOT NULL,
  `estado` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `app_modulos_negocio_rol`
--

INSERT INTO `app_modulos_negocio_rol` (`id`, `id_app_modulos_negocio`, `rol`, `estado`, `created_at`, `updated_at`) VALUES
(1, 1, 'admin', 1, '2025-11-16 22:15:26', '2025-11-16 22:15:26'),
(2, 2, 'admin', 1, '2025-11-17 03:38:07', '2025-11-17 03:38:07'),
(4, 4, 'admin', 1, '2025-11-20 23:02:44', '2025-11-20 23:02:44'),
(5, 5, 'admin', 1, '2025-11-20 23:02:56', '2025-11-20 23:02:56'),
(6, 6, 'admin', 1, '2025-11-21 19:17:33', '2025-11-21 19:17:33'),
(7, 7, 'admin', 1, '2025-12-07 21:37:15', '2025-12-07 21:37:15'),
(8, 8, 'admin', 1, '2025-12-07 23:23:30', '2025-12-07 23:23:30'),
(9, 8, 'empleado', 1, '2026-03-03 20:58:25', '2026-03-03 20:58:25');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `caja`
--

CREATE TABLE `caja` (
  `id` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `monto_inicial` decimal(12,2) NOT NULL DEFAULT 0.00,
  `estado` enum('ABIERTA','CERRADA') NOT NULL DEFAULT 'ABIERTA',
  `fecha_apertura` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_cierre` datetime DEFAULT NULL,
  `monto_final` decimal(12,2) DEFAULT NULL,
  `diferencia` decimal(12,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `caja`
--

INSERT INTO `caja` (`id`, `id_usuario`, `monto_inicial`, `estado`, `fecha_apertura`, `fecha_cierre`, `monto_final`, `diferencia`) VALUES
(23, 23, 500000.00, 'CERRADA', '2026-03-06 10:58:29', '2026-03-06 14:43:32', 500000.00, NULL),
(24, 23, 120000.00, 'ABIERTA', '2026-03-06 14:43:56', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id` int(11) UNSIGNED NOT NULL,
  `id_negocio` int(11) DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `imagen` varchar(500) DEFAULT NULL,
  `descripcion` varchar(500) NOT NULL,
  `activo` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id`, `id_negocio`, `nombre`, `imagen`, `descripcion`, `activo`) VALUES
(1, 1, 'Platos a la carta', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRCPwdtgqUB9QfFeElHJh7rbQVn5Ft1zGwQBw&s', 'Deliciosos platos a la carta', 1),
(2, 1, 'Desayunos', 'https://recetasdecocina.elmundo.es/wp-content/uploads/2022/08/desayuno-saludables-recetas.jpg', 'desayunos ', 1),
(3, 1, 'Almuerzos', 'https://plus.unsplash.com/premium_photo-1673108852141-e8c3c22a4a22?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8YWxtdWVyem98ZW58MHx8MHx8fDA%3D', 'Alumuerzo de la casa', 1),
(4, 1, 'Insumos', 'https://ingenieriademenu.com/wp-content/uploads/2024/11/Proceso-de-recepcion-de-mercancias-en-un-restaurante1.jpg', 'Insumos para el funcionamiento de platos', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `compras`
--

CREATE TABLE `compras` (
  `id` int(11) NOT NULL,
  `id_negocio` int(11) NOT NULL,
  `id_proveedor` int(11) NOT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  `subtotal` decimal(12,2) NOT NULL,
  `descuento` decimal(12,2) DEFAULT 0.00,
  `descuento_porcentaje` decimal(5,2) DEFAULT 0.00,
  `impuesto` decimal(12,2) DEFAULT 0.00,
  `total` decimal(12,2) NOT NULL,
  `estado` varchar(20) DEFAULT 'pendiente',
  `metodo_pago` varchar(50) DEFAULT 'efectivo',
  `nota` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `compras_items`
--

CREATE TABLE `compras_items` (
  `id` int(11) NOT NULL,
  `id_compra` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `precio_unitario` decimal(12,2) NOT NULL,
  `descuento` decimal(12,2) DEFAULT 0.00,
  `descuento_porcentaje` decimal(5,2) DEFAULT 0.00,
  `impuesto` decimal(12,2) DEFAULT 0.00,
  `subtotal` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `domicilios`
--

CREATE TABLE `domicilios` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `negocio_id` int(11) DEFAULT NULL,
  `direccion` varchar(200) DEFAULT NULL,
  `estado` enum('pendiente','en camino','entregado','cancelado') DEFAULT 'pendiente',
  `total` decimal(10,2) DEFAULT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `egresos`
--

CREATE TABLE `egresos` (
  `id` int(11) NOT NULL,
  `numero_consecutivo` int(11) DEFAULT NULL,
  `numero_egreso` varchar(20) DEFAULT NULL,
  `id_negocio` int(11) NOT NULL,
  `id_caja` int(11) DEFAULT NULL,
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `descripcion` varchar(255) NOT NULL,
  `metodo_pago` enum('EFECTIVO','TRANSFERENCIA','TARJETA','NEQUI','DAVIPLATA') NOT NULL,
  `monto` decimal(12,2) NOT NULL,
  `estado` enum('PENDIENTE','APROBADO','ANULADO') DEFAULT 'APROBADO',
  `observacion` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `egresos`
--

INSERT INTO `egresos` (`id`, `numero_consecutivo`, `numero_egreso`, `id_negocio`, `id_caja`, `fecha`, `descripcion`, `metodo_pago`, `monto`, `estado`, `observacion`, `created_at`, `updated_at`) VALUES
(31, 1, 'EGR-000001', 1, 23, '2026-03-06 11:12:15', 'carnes', 'EFECTIVO', 23453.00, '', 'xsfsdfs', '2026-03-06 16:12:15', '2026-03-06 16:12:15'),
(32, 2, 'EGR-000002', 1, 23, '2026-03-06 11:13:12', 'asd', 'EFECTIVO', 3453.00, '', 'ssdf', '2026-03-06 16:13:12', '2026-03-06 16:13:12'),
(33, 3, 'EGR-000003', 1, 23, '2026-03-06 11:16:17', '$ 20.000', 'EFECTIVO', 345.00, '', 'SFSDF', '2026-03-06 16:16:17', '2026-03-06 16:16:17'),
(34, 4, 'EGR-000004', 1, 23, '2026-03-06 11:16:35', 'VIAJE', 'EFECTIVO', 100000.00, '', 'ASDASD', '2026-03-06 16:16:35', '2026-03-06 16:16:35'),
(35, 5, 'EGR-000005', 1, 23, '2026-03-06 11:22:08', 'asda', 'EFECTIVO', 100000.00, '', NULL, '2026-03-06 16:22:08', '2026-03-06 16:22:08'),
(36, 6, 'EGR-000006', 1, 23, '2026-03-06 11:22:36', 'nada de nada', 'EFECTIVO', 250000.00, '', 'asdasd', '2026-03-06 16:22:36', '2026-03-06 16:22:36'),
(37, 7, 'EGR-000007', 1, 24, '2026-03-06 18:16:00', 'leche', 'EFECTIVO', 250000.00, '', 'nada de nada', '2026-03-06 23:16:00', '2026-03-06 23:16:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empleados`
--

CREATE TABLE `empleados` (
  `id` int(11) NOT NULL,
  `negocio_id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `nombre` varchar(120) DEFAULT NULL,
  `cargo` varchar(100) DEFAULT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `fecha_ingreso` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inventario`
--

CREATE TABLE `inventario` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `id_producto` int(11) NOT NULL,
  `id_negocio` int(11) NOT NULL,
  `cantidad_actual` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inventario_fisico`
--

CREATE TABLE `inventario_fisico` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `id_persona` int(11) DEFAULT NULL,
  `id_negocio` int(11) DEFAULT NULL,
  `nombre` varchar(500) NOT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  `tipo` enum('PRODUCTOS','ACTIVOS','OTROS') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `inventario_fisico`
--

INSERT INTO `inventario_fisico` (`id`, `id_persona`, `id_negocio`, `nombre`, `fecha`, `tipo`) VALUES
(12, 1, 1, 'Inventario General Restaurante Productos', '2025-11-20 17:46:23', 'PRODUCTOS'),
(13, 1, 1, 'Inventario fisco', '2025-11-20 20:05:43', 'ACTIVOS');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inventario_fisico_detalles`
--

CREATE TABLE `inventario_fisico_detalles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `id_inventario_fisico` int(11) NOT NULL,
  `id_producto` int(11) DEFAULT NULL,
  `id_activo` int(11) DEFAULT NULL,
  `cantidad_sistema` decimal(12,2) NOT NULL DEFAULT 0.00,
  `cantidad_fisica` decimal(12,2) NOT NULL DEFAULT 0.00,
  `diferencia` decimal(12,2) GENERATED ALWAYS AS (`cantidad_fisica` - `cantidad_sistema`) STORED,
  `observacion` text DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `inventario_fisico_detalles`
--

INSERT INTO `inventario_fisico_detalles` (`id`, `id_inventario_fisico`, `id_producto`, `id_activo`, `cantidad_sistema`, `cantidad_fisica`, `observacion`, `fecha_registro`) VALUES
(1, 12, 1, NULL, 15.00, 12.00, 'Gaseosas', '2025-11-20 17:51:16'),
(2, 12, 2, NULL, 50.00, 30.00, 'pollo al clima', '2025-11-20 17:53:05');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mesas`
--

CREATE TABLE `mesas` (
  `id` int(11) NOT NULL,
  `id_negocio` int(11) DEFAULT NULL,
  `nombre` varchar(50) DEFAULT NULL,
  `capacidad` int(11) NOT NULL DEFAULT 2,
  `estado` enum('Disponible','Ocupada','Reservada') DEFAULT 'Disponible',
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `mesas`
--

INSERT INTO `mesas` (`id`, `id_negocio`, `nombre`, `capacidad`, `estado`, `fecha_creacion`) VALUES
(1, 1, 'Mesa1', 4, 'Ocupada', '2025-12-11 23:32:41'),
(2, 1, 'Mesa 2', 4, 'Ocupada', '2025-12-11 23:41:26'),
(3, 1, 'Mesa 3', 4, 'Disponible', '2025-12-11 23:41:42'),
(4, 1, 'Mesa 4', 2, 'Ocupada', '2025-12-11 23:42:18'),
(5, 1, 'Mesa 5', 4, 'Disponible', '2025-12-29 10:11:25'),
(6, 1, 'Mesa 6', 4, 'Disponible', '2026-03-03 09:52:49'),
(7, 1, 'mesa 7', 4, 'Disponible', '2026-03-03 09:52:49'),
(8, 1, 'Mesa 8', 4, 'Ocupada', '2026-03-03 09:53:13'),
(9, 1, 'mesa 9', 2, 'Ocupada', '2026-03-03 09:53:13'),
(10, 1, 'mesa 10', 4, 'Ocupada', '2026-03-03 09:53:33'),
(11, 1, 'mesa 11', 2, 'Disponible', '2026-03-03 09:53:33'),
(12, 1, 'mesa 12', 2, 'Disponible', '2026-03-03 09:53:55'),
(13, 1, 'mesa 13', 2, 'Disponible', '2026-03-03 09:53:55');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `movimientos_inventario`
--

CREATE TABLE `movimientos_inventario` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `id_producto` int(11) NOT NULL,
  `id_negocio` int(11) NOT NULL,
  `tipo` varchar(10) NOT NULL CHECK (`tipo` in ('entrada','salida')),
  `cantidad` decimal(10,2) NOT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  `detalle` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `negocios`
--

CREATE TABLE `negocios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `direccion` varchar(200) DEFAULT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `negocios`
--

INSERT INTO `negocios` (`id`, `nombre`, `direccion`, `telefono`, `descripcion`, `fecha_creacion`) VALUES
(1, 'Restaurante Mestizo', 'San juan de pasto', '3162467600', 'Restaurante el Dorado', '2025-11-21 19:51:06'),
(3, 'Minimarket Sarita', 'llorente', '3146027224', 'Minimarket llorente Nariño', '2025-11-21 19:52:02'),
(4, 'Restaurante de prueba ', 'casa 11', '343543', '', '2025-11-21 20:03:58');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos`
--

CREATE TABLE `pagos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `id_venta` int(11) NOT NULL,
  `estado_pago` tinyint(1) NOT NULL DEFAULT 0,
  `metodo_pago` enum('EFECTIVO','TARJETA','TRANSFERENCIA','PENDIENTE','NEQUI','DAVIPLATA') NOT NULL,
  `monto_pagado` decimal(10,2) DEFAULT NULL,
  `monto_recibido` decimal(10,2) DEFAULT NULL,
  `cambio` int(11) DEFAULT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pagos`
--

INSERT INTO `pagos` (`id`, `id_venta`, `estado_pago`, `metodo_pago`, `monto_pagado`, `monto_recibido`, `cambio`, `fecha`, `fecha_actualizacion`) VALUES
(149, 191, 1, 'EFECTIVO', 18000.00, 20000.00, 2000, '2026-03-06 15:58:51', '2026-03-06 15:58:57'),
(150, 192, 1, 'EFECTIVO', 40000.00, 50000.00, 10000, '2026-03-06 15:59:20', NULL),
(151, 193, 1, 'EFECTIVO', 40000.00, 50000.00, 10000, '2026-03-06 16:22:49', '2026-03-06 16:22:59'),
(152, 194, 1, 'EFECTIVO', 118000.00, 200000.00, 82000, '2026-03-06 19:35:17', '2026-03-06 19:44:39'),
(153, 195, 1, 'EFECTIVO', 40000.00, 50000.00, 10000, '2026-03-06 19:35:44', '2026-03-06 19:44:54'),
(154, 196, 1, 'EFECTIVO', 40000.00, 50000.00, 10000, '2026-03-06 19:35:50', '2026-03-06 19:45:00'),
(155, 197, 1, 'EFECTIVO', 12000.00, 15000.00, 3000, '2026-03-06 19:35:56', '2026-03-06 20:43:17'),
(156, 198, 1, 'EFECTIVO', 40000.00, 500000.00, 460000, '2026-03-06 19:36:01', '2026-03-06 20:43:29'),
(157, 199, 1, 'EFECTIVO', 18000.00, 20000.00, 2000, '2026-03-06 19:36:08', '2026-03-06 20:43:23'),
(158, 200, 0, 'PENDIENTE', 24000.00, 0.00, 0, '2026-03-06 19:36:48', NULL),
(159, 201, 1, 'EFECTIVO', 8000.00, 10000.00, 2000, '2026-03-06 19:38:03', '2026-03-06 20:43:37'),
(160, 202, 1, 'EFECTIVO', 66000.00, 70000.00, 4000, '2026-03-06 19:38:46', '2026-03-06 20:43:42'),
(161, 203, 1, 'EFECTIVO', 40000.00, 50000.00, 10000, '2026-03-06 19:45:12', '2026-03-06 20:43:01'),
(162, 204, 1, 'EFECTIVO', 58000.00, 60000.00, 2000, '2026-03-06 20:43:56', '2026-03-06 21:13:58'),
(163, 205, 1, 'EFECTIVO', 20000.00, 25000.00, 5000, '2026-03-06 21:18:26', '2026-03-06 21:27:17'),
(164, 206, 0, 'PENDIENTE', 40000.00, 0.00, 0, '2026-03-06 21:34:30', NULL),
(165, 207, 0, 'PENDIENTE', 60000.00, 0.00, 0, '2026-03-06 21:35:06', NULL),
(166, 208, 0, 'PENDIENTE', 40000.00, 0.00, 0, '2026-03-06 21:47:37', NULL),
(167, 209, 0, 'PENDIENTE', 40000.00, 0.00, 0, '2026-03-06 23:16:25', NULL),
(168, 210, 0, 'PENDIENTE', 20000.00, 0.00, 0, '2026-03-06 23:17:11', NULL),
(169, 211, 0, 'PENDIENTE', 20000.00, 0.00, 0, '2026-03-06 23:23:11', NULL),
(170, 212, 1, 'EFECTIVO', 20000.00, 30000.00, 10000, '2026-03-06 23:23:56', '2026-03-06 23:32:53'),
(171, 213, 0, 'PENDIENTE', 20000.00, 0.00, 0, '2026-03-06 23:27:02', NULL),
(172, 214, 0, 'PENDIENTE', 20000.00, 0.00, 0, '2026-03-06 23:27:12', NULL),
(173, 215, 0, 'PENDIENTE', 40000.00, 0.00, 0, '2026-03-06 23:27:55', NULL),
(174, 216, 1, 'EFECTIVO', 36000.00, 50000.00, 14000, '2026-03-06 23:30:34', '2026-03-06 23:30:52'),
(175, 217, 0, 'PENDIENTE', 363400.00, 0.00, 0, '2026-03-07 00:00:22', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `personas`
--

CREATE TABLE `personas` (
  `id` int(11) NOT NULL,
  `tipo_identificacion` varchar(50) DEFAULT NULL,
  `identificacion` varchar(50) DEFAULT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `tipo` enum('cliente','proveedor','empleado','otro') NOT NULL DEFAULT 'cliente',
  `email` varchar(100) DEFAULT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `direccion` text DEFAULT NULL,
  `nota` text DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `personas`
--

INSERT INTO `personas` (`id`, `tipo_identificacion`, `identificacion`, `nombres`, `apellidos`, `tipo`, `email`, `telefono`, `direccion`, `nota`, `fecha_creacion`) VALUES
(1, 'CC', '1233194302', 'Admin', 'Caratar Pabon', 'cliente', 'ing@alexis@gmail.com', '3162467600', 'Torres san luis', 'Administrador', '2025-11-17 21:14:32'),
(13, 'CC', '9879878', 'juan', 'perez', 'cliente', NULL, '87687687', 'pasto', NULL, '2025-11-18 04:12:06'),
(14, 'CC', '1233194305', 'alexistos', 'asdad', 'cliente', NULL, '3162467600', 'manzana O casa 18', NULL, '2025-11-21 16:17:03'),
(15, 'CC', '97415439', 'Sara Maria ', 'Pabon Riascos', 'cliente', NULL, '3146027224', 'manzana O casa 18', NULL, '2025-11-21 16:17:35'),
(16, 'CC', '1233194301', 'Yohan Alexis ', 'Caratar Pabon', 'cliente', NULL, '3162467600', 'Torres san luis', NULL, '2025-11-21 16:43:43'),
(17, 'CC', '345345', 'dfgdfg', 'dfgdf', 'cliente', NULL, 'dfgdfg', 'dfgdfg', NULL, '2025-11-21 20:04:25'),
(18, 'CC', '00000000', 'CLIENTE', 'VARIOS', 'cliente', 'clientevarios@gmail.com', '0000000', 'San juan de Pasto', NULL, '2025-12-11 00:21:56'),
(19, 'CC', '1084224857', 'edwin ', 'jojoa', 'cliente', NULL, '3125503210', 'MANZANA O CASA 18', NULL, '2026-03-03 20:41:40'),
(21, 'CC', '1084224858', 'edwin ', 'jojoa', 'cliente', NULL, '3125503210', 'MANZANA O CASA 18', NULL, '2026-03-03 20:42:23');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id` int(11) UNSIGNED NOT NULL,
  `codigo_barra` varchar(100) DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `unidad_medida` varchar(20) DEFAULT NULL,
  `id_categoria` int(11) UNSIGNED DEFAULT NULL,
  `tipo_producto` enum('producto_terminado','insumo','combo_mixto','servicio','otro') DEFAULT 'producto_terminado',
  `stock_actual` int(11) DEFAULT 0,
  `stock_minimo` int(11) DEFAULT 0,
  `stock_maximo` int(11) DEFAULT 0,
  `estado` tinyint(4) DEFAULT 1,
  `publicacion_web` tinyint(1) DEFAULT 0,
  `creacion` datetime DEFAULT current_timestamp(),
  `actualizacion` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `codigo_barra`, `nombre`, `descripcion`, `unidad_medida`, `id_categoria`, `tipo_producto`, `stock_actual`, `stock_minimo`, `stock_maximo`, `estado`, `publicacion_web`, `creacion`, `actualizacion`) VALUES
(1, '10', 'Pollo en salsa', 'Almuerzo de pollo con salsa de la casa, 1/4 de pollo broster acompañado de delicioso jugo 2', 'pieza', 1, 'producto_terminado', 10, 5, 20, 1, 0, '2025-11-28 14:30:28', '2025-12-11 17:26:47'),
(3, '7', 'Desayuno Casero', 'Desayuno Casero con huevos', 'litro', 2, '', 10, 5, 20, 1, 0, '2025-11-28 14:30:28', '2025-12-11 17:20:58'),
(10, '9', 'Bandeja paisa', 'Bandeja paisa', 'pieza', 1, '', 10, 5, 20, 1, 0, '2025-11-28 17:40:15', '2025-12-11 17:25:46'),
(14, '869749465465', 'filte de pollo', 'pollo en filites', 'pieza', 4, 'producto_terminado', 50, 10, 80, 1, 0, '2025-12-02 17:00:32', '2025-12-02 17:15:13'),
(15, '45645', 'costilla ahumada', 'porcion de costilla ahumada de 100 gramos ', 'kg', 4, 'insumo', 45, 50, 60, 1, 0, '2025-12-03 16:46:52', '2025-12-03 16:46:52'),
(16, '1', 'Pollo plancha', 'Delicioso almuerzo de pollo a la plancha', 'pieza', 3, '', 10, 2, 25, 1, 0, '2025-12-11 16:33:28', '2026-03-05 08:02:23'),
(17, '2', 'Cerdo plancha', 'Delicioso Almuerzo de cerdo a la plancha', 'pieza', 3, '', 10, 5, 25, 1, 0, '2025-12-11 16:35:01', '2026-03-05 08:02:20'),
(18, '3', 'Chuleta de Pollo', 'Almuerzo con deliciosa chuleta de pollo', 'pieza', 3, '', 10, 5, 25, 1, 0, '2025-12-11 16:38:57', '2026-03-05 08:02:15'),
(19, '4', 'Chuleta de Cerdo', 'Delicioso Almuerzo con chuleta de cerdo', 'pieza', 3, '', 5, 10, 25, 1, 0, '2025-12-11 16:41:02', '2026-03-05 08:02:12'),
(20, '5', 'Gulash', 'Delicioso Almuerzo con gulash', 'pieza', 3, 'insumo', 15, 5, 20, 1, 0, '2025-12-11 17:14:35', '2025-12-11 17:14:35'),
(21, '6', 'Churrasco', 'Delicioso Almuerzo con churrasco', 'pieza', 3, '', 10, 5, 20, 1, 0, '2025-12-11 17:16:03', '2026-03-05 18:54:55'),
(22, '8', 'Desayuno con Carne', 'Delicioso Desayuno con porcion de carne', 'pieza', 2, '', 10, 5, 20, 1, 0, '2025-12-11 17:19:42', '2025-12-11 17:19:42');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos_imagenes`
--

CREATE TABLE `productos_imagenes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `id_producto` int(11) NOT NULL,
  `url` varchar(255) NOT NULL,
  `orden` int(11) DEFAULT 0,
  `activo` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `productos_imagenes`
--

INSERT INTO `productos_imagenes` (`id`, `id_producto`, `url`, `orden`, `activo`) VALUES
(2, 1, 'https://static.bainet.es/clip/27fb5aa6-a019-4edb-88fd-801212bae27d_source-aspect-ratio_1600w_0.jpg', 2, 1),
(4, 10, 'https://buenprovecho.hn/wp-content/uploads/2023/07/Diseno-sin-titulo-3.png', 0, 1),
(8, 16, 'https://img.freepik.com/fotos-premium/pechuga-pollo-plancha-arroz-ensalada-verde_491130-1235.jpg', 0, 1),
(9, 17, 'https://img.freepik.com/fotos-premium/cerdo-plancha-farofa-arroz-patatas-fritas_538646-12679.jpg', 0, 1),
(10, 18, 'https://png.pngtree.com/background/20230906/original/pngtree-chicken-chop-on-background-healthy-eat-lunch-photo-picture-image_4968950.jpg', 0, 1),
(11, 19, 'https://media.istockphoto.com/id/1093507584/es/foto/chuleta-de-cerdo-frita-pur%C3%A9-de-patatas-y-verduras.jpg?s=612x612&w=0&k=20&c=b7fmjJU-mGdCj5MBxt7SDezOIWbOEfB1PYAeFPu0-do=', 0, 1),
(12, 20, 'https://cdn.colombia.com/gastronomia/2016/06/27/goulash-con-verduras-2992.jpg', 0, 1),
(13, 21, 'https://img.freepik.com/foto-gratis/alimentos-pre-preparados-que-muestran-comidas-deliciosas-listas-comer-camino_23-2151431652.jpg?semt=ais_se_enriched&w=740&q=80', 0, 1),
(14, 3, 'https://www.recetasnestle.com.co/sites/default/files/styles/cropped_recipe_card_new/public/srh_recipes/1b49f4b41df21c804db0a460d5503016.jpg.webp?itok=C0bZaBqm', 0, 1),
(15, 22, 'https://media.istockphoto.com/id/155601165/es/foto/bistec-y-los-huevos.jpg?s=612x612&w=0&k=20&c=lFsckfVSwFqJy0eskTdrIR2hdFDoqEJRrjItX9bCyUc=', 0, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos_precios`
--

CREATE TABLE `productos_precios` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `id_producto` int(10) UNSIGNED NOT NULL,
  `precio_costo` decimal(10,2) NOT NULL,
  `precio_venta` decimal(10,2) NOT NULL,
  `precio_anterior` decimal(10,2) DEFAULT NULL,
  `precio_mayorista` decimal(10,2) DEFAULT NULL,
  `descuento_valor` decimal(12,2) DEFAULT 0.00,
  `descuento_porcentaje` decimal(5,2) DEFAULT 0.00,
  `fecha_inicio_promo` date DEFAULT NULL,
  `fecha_fin_promo` date DEFAULT NULL,
  `activo_promo` tinyint(1) DEFAULT 1,
  `utilidad_porcentaje` decimal(6,2) GENERATED ALWAYS AS ((`precio_venta` - `precio_costo`) / `precio_costo` * 100) STORED,
  `usuario_modifico` varchar(100) DEFAULT NULL,
  `fecha_modificacion` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `productos_precios`
--

INSERT INTO `productos_precios` (`id`, `id_producto`, `precio_costo`, `precio_venta`, `precio_anterior`, `precio_mayorista`, `descuento_valor`, `descuento_porcentaje`, `fecha_inicio_promo`, `fecha_fin_promo`, `activo_promo`, `usuario_modifico`, `fecha_modificacion`) VALUES
(1, 1, 15000.00, 20000.00, 6000.00, 78000.00, 0.00, 0.00, NULL, NULL, 1, NULL, '2025-12-11 17:26:47'),
(3, 10, 15000.00, 20000.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, 0, NULL, '2025-12-11 17:25:32'),
(4, 14, 2500.00, 2700.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, 0, NULL, '2025-12-02 17:00:32'),
(5, 15, 25000.00, 75000.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, 0, NULL, '2025-12-03 16:46:52'),
(6, 16, 11500.00, 12000.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, 0, NULL, '2025-12-11 16:33:28'),
(7, 17, 11500.00, 12000.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, 0, NULL, '2025-12-11 16:35:01'),
(8, 18, 11500.00, 12000.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, 0, NULL, '2025-12-11 16:38:57'),
(9, 19, 11500.00, 12000.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, 0, NULL, '2025-12-11 16:41:02'),
(10, 20, 11500.00, 12000.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, 0, NULL, '2025-12-11 17:14:35'),
(11, 21, 11500.00, 12000.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, 0, NULL, '2025-12-11 17:16:03'),
(12, 3, 7500.00, 8000.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, 0, NULL, '2025-12-11 17:18:25'),
(13, 22, 9500.00, 10000.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, 0, NULL, '2025-12-11 17:19:42');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `producto_insumo`
--

CREATE TABLE `producto_insumo` (
  `id` int(11) NOT NULL,
  `id_producto` int(10) UNSIGNED NOT NULL,
  `id_insumo` int(10) UNSIGNED NOT NULL,
  `cantidad` decimal(10,2) NOT NULL DEFAULT 1.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reservas`
--

CREATE TABLE `reservas` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `empleado_id` int(11) DEFAULT NULL,
  `negocio_id` int(11) NOT NULL,
  `mesa_id` int(11) DEFAULT NULL,
  `fecha_reserva` datetime NOT NULL,
  `cantidad_personas` int(11) NOT NULL,
  `estado` enum('pendiente','confirmada','cancelada') DEFAULT 'pendiente',
  `observaciones` text DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ubicaciones`
--

CREATE TABLE `ubicaciones` (
  `id_ubicacion` bigint(20) UNSIGNED NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `id_persona` int(11) DEFAULT NULL,
  `email` varchar(120) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('admin','cliente','empleado') DEFAULT 'cliente',
  `id_negocio` int(11) NOT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `imagen` varchar(255) NOT NULL DEFAULT 'https://e7.pngegg.com/pngimages/340/946/png-clipart-avatar-user-computer-icons-software-developer-avatar-child-face-thumbnail.png\r\n'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `id_persona`, `email`, `password`, `rol`, `id_negocio`, `fecha_creacion`, `imagen`) VALUES
(23, 1, 'admin@gmail.com', '$2b$10$YTHbCcGSWTrDC1phmHus..3bbGjVJ.ujyMRsXfbhAls/mIDn4XXLO', 'admin', 1, '2025-11-18 02:22:46', 'https://e7.pngegg.com/pngimages/340/946/png-clipart-avatar-user-computer-icons-software-developer-avatar-child-face-thumbnail.png'),
(30, 15, 'alexistos-5439@gmail.com', '$2b$10$R5ZbOPOal/I6YN/C2o9M6ObU6SoMIGr79wm2vOn4bIIpzLpBednA2', 'admin', 1, '2025-11-21 16:17:35', 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.pngegg.com%2Fes%2Fsearch%3Fq%3Davatar&psig=AOvVaw3cy7Tbo5O0M2jfkkQg9rYe&ust=1763828243218000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCMCXv7LSg5EDFQAAAAAdAAAAABAE'),
(31, 16, 'yohan4301@gmail.com', '$2b$10$.3aj8d0HeKDz.RuPqxMYOeUPtblOjueD2e2/EZxaxUR0nwNTaqZui', 'admin', 1, '2025-11-21 16:43:43', 'https://e7.pngegg.com/pngimages/340/946/png-clipart-avatar-user-computer-icons-software-developer-avatar-child-face-thumbnail.png'),
(33, 21, 'edwin4858@gmail.com', '$2b$10$rWCCEAOj6reiISSGs9vU0umetd/iPEQshGznAwiYUx47dvoh/Xqm6', 'empleado', 1, '2026-03-03 20:42:23', 'https://www.shutterstock.com/image-illustration/edwin-popular-nick-name-arround-260nw-1181146657.jpg');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas`
--

CREATE TABLE `ventas` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `numero_consecutivo` int(11) NOT NULL,
  `numero_factura` varchar(20) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `id_caja` int(11) NOT NULL,
  `id_mesa` int(11) DEFAULT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  `subtotal` decimal(12,2) NOT NULL,
  `descuento` decimal(12,2) DEFAULT 0.00,
  `descuento_porcentaje` decimal(5,2) DEFAULT 0.00,
  `impuesto` decimal(12,2) DEFAULT 0.00,
  `total` decimal(12,2) NOT NULL,
  `estado` varchar(20) DEFAULT 'pendiente',
  `metodo_pago` varchar(50) DEFAULT 'efectivo',
  `nota` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ventas`
--

INSERT INTO `ventas` (`id`, `numero_consecutivo`, `numero_factura`, `id_cliente`, `id_caja`, `id_mesa`, `fecha`, `subtotal`, `descuento`, `descuento_porcentaje`, `impuesto`, `total`, `estado`, `metodo_pago`, `nota`) VALUES
(191, 1, 'POS-000001', 18, 23, 1, '2026-03-06 15:58:51', 18000.00, 0.00, 0.00, 0.00, 18000.00, 'PENDIENTE', 'EFECTIVO', ''),
(192, 2, 'POS-000002', 18, 23, 2, '2026-03-06 15:59:20', 40000.00, 0.00, 0.00, 0.00, 40000.00, 'PENDIENTE', 'EFECTIVO', ''),
(193, 3, 'POS-000003', 18, 23, 1, '2026-03-06 16:22:49', 40000.00, 0.00, 0.00, 0.00, 40000.00, 'PENDIENTE', 'EFECTIVO', ''),
(194, 4, 'POS-000004', 18, 23, 1, '2026-03-06 19:35:17', 118000.00, 0.00, 0.00, 0.00, 118000.00, 'PENDIENTE', 'EFECTIVO', ''),
(195, 5, 'POS-000005', 18, 23, 2, '2026-03-06 19:35:44', 40000.00, 0.00, 0.00, 0.00, 40000.00, 'PENDIENTE', 'EFECTIVO', ''),
(196, 6, 'POS-000006', 18, 23, 3, '2026-03-06 19:35:50', 40000.00, 0.00, 0.00, 0.00, 40000.00, 'PENDIENTE', 'EFECTIVO', ''),
(197, 7, 'POS-000007', 18, 23, 4, '2026-03-06 19:35:56', 12000.00, 0.00, 0.00, 0.00, 12000.00, 'PENDIENTE', 'EFECTIVO', ''),
(198, 8, 'POS-000008', 18, 23, 5, '2026-03-06 19:36:01', 40000.00, 0.00, 0.00, 0.00, 40000.00, 'PENDIENTE', 'EFECTIVO', ''),
(199, 9, 'POS-000009', 18, 23, 6, '2026-03-06 19:36:08', 18000.00, 0.00, 0.00, 0.00, 18000.00, 'PENDIENTE', 'EFECTIVO', ''),
(200, 10, 'POS-000010', 18, 23, NULL, '2026-03-06 19:36:48', 24000.00, 0.00, 0.00, 0.00, 24000.00, 'PENDIENTE', 'EFECTIVO', ''),
(201, 11, 'POS-000011', 18, 23, 7, '2026-03-06 19:38:03', 8000.00, 0.00, 0.00, 0.00, 8000.00, 'PENDIENTE', 'EFECTIVO', ''),
(202, 12, 'POS-000012', 18, 23, 8, '2026-03-06 19:38:46', 66000.00, 0.00, 0.00, 0.00, 66000.00, 'PENDIENTE', 'EFECTIVO', ''),
(203, 13, 'POS-000013', 18, 24, 1, '2026-03-06 19:45:12', 40000.00, 0.00, 0.00, 0.00, 40000.00, 'PENDIENTE', 'EFECTIVO', ''),
(204, 14, 'POS-000014', 18, 24, 1, '2026-03-06 20:43:56', 58000.00, 0.00, 0.00, 0.00, 58000.00, 'PENDIENTE', 'EFECTIVO', ''),
(205, 15, 'POS-000015', 18, 24, 1, '2026-03-06 21:18:26', 20000.00, 0.00, 0.00, 0.00, 20000.00, 'PENDIENTE', 'EFECTIVO', ''),
(206, 16, 'POS-000016', 18, 24, NULL, '2026-03-06 21:34:30', 40000.00, 0.00, 0.00, 0.00, 40000.00, 'PENDIENTE', 'EFECTIVO', ''),
(207, 17, 'POS-000017', 18, 24, NULL, '2026-03-06 21:35:06', 60000.00, 0.00, 0.00, 0.00, 60000.00, 'PENDIENTE', 'EFECTIVO', ''),
(208, 18, 'POS-000018', 18, 24, 4, '2026-03-06 21:47:37', 40000.00, 0.00, 0.00, 0.00, 40000.00, 'PENDIENTE', 'EFECTIVO', ''),
(209, 19, 'POS-000019', 18, 24, 1, '2026-03-06 23:16:25', 40000.00, 0.00, 0.00, 0.00, 40000.00, 'PENDIENTE', 'EFECTIVO', ''),
(210, 20, 'POS-000020', 18, 24, NULL, '2026-03-06 23:17:11', 20000.00, 0.00, 0.00, 0.00, 20000.00, 'PENDIENTE', 'EFECTIVO', ''),
(211, 21, 'POS-000021', 18, 24, 3, '2026-03-06 23:23:11', 20000.00, 0.00, 0.00, 0.00, 20000.00, 'PENDIENTE', 'EFECTIVO', ''),
(212, 22, 'POS-000022', 18, 24, 3, '2026-03-06 23:23:56', 20000.00, 0.00, 0.00, 0.00, 20000.00, 'PENDIENTE', 'EFECTIVO', ''),
(213, 23, 'POS-000023', 18, 24, 10, '2026-03-06 23:27:02', 20000.00, 0.00, 0.00, 0.00, 20000.00, 'PENDIENTE', 'EFECTIVO', ''),
(214, 24, 'POS-000024', 18, 24, 9, '2026-03-06 23:27:12', 20000.00, 0.00, 0.00, 0.00, 20000.00, 'PENDIENTE', 'EFECTIVO', ''),
(215, 25, 'POS-000025', 18, 24, 8, '2026-03-06 23:27:55', 40000.00, 0.00, 0.00, 0.00, 40000.00, 'PENDIENTE', 'EFECTIVO', ''),
(216, 26, 'POS-000026', 18, 24, 13, '2026-03-06 23:30:34', 36000.00, 0.00, 0.00, 0.00, 36000.00, 'PENDIENTE', 'EFECTIVO', ''),
(217, 27, 'POS-000027', 18, 24, 2, '2026-03-07 00:00:22', 363400.00, 0.00, 0.00, 0.00, 363400.00, 'PENDIENTE', 'EFECTIVO', '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas_items`
--

CREATE TABLE `ventas_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `id_venta` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `precio_unitario` decimal(12,2) NOT NULL,
  `descuento` decimal(12,2) DEFAULT 0.00,
  `descuento_porcentaje` decimal(5,2) DEFAULT 0.00,
  `impuesto` decimal(12,2) DEFAULT 0.00,
  `subtotal` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ventas_items`
--

INSERT INTO `ventas_items` (`id`, `id_venta`, `id_producto`, `cantidad`, `precio_unitario`, `descuento`, `descuento_porcentaje`, `impuesto`, `subtotal`) VALUES
(465, 191, 3, 1.00, 8000.00, 0.00, 0.00, 0.00, 8000.00),
(466, 191, 22, 1.00, 10000.00, 0.00, 0.00, 0.00, 10000.00),
(467, 192, 1, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(468, 192, 10, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(469, 193, 1, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(470, 193, 10, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(471, 194, 1, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(472, 194, 10, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(473, 194, 3, 1.00, 8000.00, 0.00, 0.00, 0.00, 8000.00),
(474, 194, 22, 1.00, 10000.00, 0.00, 0.00, 0.00, 10000.00),
(475, 194, 16, 1.00, 12000.00, 0.00, 0.00, 0.00, 12000.00),
(476, 194, 17, 1.00, 12000.00, 0.00, 0.00, 0.00, 12000.00),
(477, 194, 19, 1.00, 12000.00, 0.00, 0.00, 0.00, 12000.00),
(478, 194, 21, 1.00, 12000.00, 0.00, 0.00, 0.00, 12000.00),
(479, 194, 20, 1.00, 12000.00, 0.00, 0.00, 0.00, 12000.00),
(480, 195, 1, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(481, 195, 10, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(482, 196, 10, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(483, 196, 1, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(484, 197, 17, 1.00, 12000.00, 0.00, 0.00, 0.00, 12000.00),
(485, 198, 10, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(486, 198, 1, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(487, 199, 3, 1.00, 8000.00, 0.00, 0.00, 0.00, 8000.00),
(488, 199, 22, 1.00, 10000.00, 0.00, 0.00, 0.00, 10000.00),
(489, 200, 18, 1.00, 12000.00, 0.00, 0.00, 0.00, 12000.00),
(490, 200, 19, 1.00, 12000.00, 0.00, 0.00, 0.00, 12000.00),
(491, 201, 3, 1.00, 8000.00, 0.00, 0.00, 0.00, 8000.00),
(492, 202, 3, 2.00, 8000.00, 0.00, 0.00, 0.00, 16000.00),
(493, 202, 22, 5.00, 10000.00, 0.00, 0.00, 0.00, 50000.00),
(494, 203, 1, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(495, 203, 10, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(496, 204, 1, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(497, 204, 10, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(498, 204, 3, 1.00, 8000.00, 0.00, 0.00, 0.00, 8000.00),
(499, 204, 22, 1.00, 10000.00, 0.00, 0.00, 0.00, 10000.00),
(500, 205, 1, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(501, 206, 1, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(502, 206, 10, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(503, 207, 16, 1.00, 12000.00, 0.00, 0.00, 0.00, 12000.00),
(504, 207, 17, 1.00, 12000.00, 0.00, 0.00, 0.00, 12000.00),
(505, 207, 19, 1.00, 12000.00, 0.00, 0.00, 0.00, 12000.00),
(506, 207, 20, 1.00, 12000.00, 0.00, 0.00, 0.00, 12000.00),
(507, 207, 21, 1.00, 12000.00, 0.00, 0.00, 0.00, 12000.00),
(508, 208, 1, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(509, 208, 10, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(510, 209, 1, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(511, 209, 10, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(512, 210, 1, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(513, 211, 10, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(514, 212, 10, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(515, 213, 10, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(516, 214, 10, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(517, 215, 10, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(518, 215, 1, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(519, 216, 17, 1.00, 12000.00, 0.00, 0.00, 0.00, 12000.00),
(520, 216, 16, 1.00, 12000.00, 0.00, 0.00, 0.00, 12000.00),
(521, 216, 21, 1.00, 12000.00, 0.00, 0.00, 0.00, 12000.00),
(522, 217, 1, 2.00, 20000.00, 0.00, 0.00, 0.00, 40000.00),
(523, 217, 10, 1.00, 20000.00, 0.00, 0.00, 0.00, 20000.00),
(524, 217, 3, 1.00, 8000.00, 0.00, 0.00, 0.00, 8000.00),
(525, 217, 22, 2.00, 10000.00, 0.00, 0.00, 0.00, 20000.00),
(526, 217, 16, 2.00, 12000.00, 0.00, 0.00, 0.00, 24000.00),
(527, 217, 17, 2.00, 12000.00, 0.00, 0.00, 0.00, 24000.00),
(528, 217, 21, 2.00, 12000.00, 0.00, 0.00, 0.00, 24000.00),
(529, 217, 20, 2.00, 12000.00, 0.00, 0.00, 0.00, 24000.00),
(530, 217, 18, 1.00, 12000.00, 0.00, 0.00, 0.00, 12000.00),
(531, 217, 19, 1.00, 12000.00, 0.00, 0.00, 0.00, 12000.00),
(532, 217, 14, 2.00, 2700.00, 0.00, 0.00, 0.00, 5400.00),
(533, 217, 15, 2.00, 75000.00, 0.00, 0.00, 0.00, 150000.00);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `activos`
--
ALTER TABLE `activos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`);

--
-- Indices de la tabla `app_modulos`
--
ALTER TABLE `app_modulos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `app_modulos_negocio`
--
ALTER TABLE `app_modulos_negocio`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_negocio` (`id_negocio`) USING BTREE,
  ADD KEY `id_modulo` (`id_modulo`) USING BTREE;

--
-- Indices de la tabla `app_modulos_negocio_rol`
--
ALTER TABLE `app_modulos_negocio_rol`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_app_modulos_negocio` (`id_app_modulos_negocio`);

--
-- Indices de la tabla `caja`
--
ALTER TABLE `caja`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_caja_usuario` (`id_usuario`);

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_categorias` (`id_negocio`);

--
-- Indices de la tabla `compras`
--
ALTER TABLE `compras`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_negocio` (`id_negocio`),
  ADD KEY `id_proveedor` (`id_proveedor`);

--
-- Indices de la tabla `compras_items`
--
ALTER TABLE `compras_items`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `domicilios`
--
ALTER TABLE `domicilios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `negocio_id` (`negocio_id`);

--
-- Indices de la tabla `egresos`
--
ALTER TABLE `egresos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_egreso_negocio` (`id_negocio`),
  ADD KEY `fk_egreso_caja` (`id_caja`);

--
-- Indices de la tabla `empleados`
--
ALTER TABLE `empleados`
  ADD PRIMARY KEY (`id`),
  ADD KEY `negocio_id` (`negocio_id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `inventario`
--
ALTER TABLE `inventario`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id_producto` (`id_producto`,`id_negocio`);

--
-- Indices de la tabla `inventario_fisico`
--
ALTER TABLE `inventario_fisico`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `inventario_fisico_detalles`
--
ALTER TABLE `inventario_fisico_detalles`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `mesas`
--
ALTER TABLE `mesas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_ventas_negocios` (`id_negocio`);

--
-- Indices de la tabla `movimientos_inventario`
--
ALTER TABLE `movimientos_inventario`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `negocios`
--
ALTER TABLE `negocios`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `personas`
--
ALTER TABLE `personas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `identificacion` (`identificacion`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo_barra` (`codigo_barra`),
  ADD UNIQUE KEY `codigo_barra_2` (`codigo_barra`),
  ADD KEY `id_categoria` (`id_categoria`);

--
-- Indices de la tabla `productos_imagenes`
--
ALTER TABLE `productos_imagenes`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `productos_precios`
--
ALTER TABLE `productos_precios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_productos_precios_productos` (`id_producto`);

--
-- Indices de la tabla `producto_insumo`
--
ALTER TABLE `producto_insumo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_producto` (`id_producto`),
  ADD KEY `id_insumo` (`id_insumo`);

--
-- Indices de la tabla `reservas`
--
ALTER TABLE `reservas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `empleado_id` (`empleado_id`),
  ADD KEY `negocio_id` (`negocio_id`),
  ADD KEY `mesa_id` (`mesa_id`);

--
-- Indices de la tabla `ubicaciones`
--
ALTER TABLE `ubicaciones`
  ADD PRIMARY KEY (`id_ubicacion`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `email_2` (`email`),
  ADD KEY `usuarios_fk_negocio` (`id_negocio`),
  ADD KEY `fk_usuarios_persona` (`id_persona`);

--
-- Indices de la tabla `ventas`
--
ALTER TABLE `ventas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_cliente` (`id_cliente`),
  ADD KEY `fk_ventas_mesas` (`id_mesa`);

--
-- Indices de la tabla `ventas_items`
--
ALTER TABLE `ventas_items`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `activos`
--
ALTER TABLE `activos`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `app_modulos`
--
ALTER TABLE `app_modulos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `app_modulos_negocio`
--
ALTER TABLE `app_modulos_negocio`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `app_modulos_negocio_rol`
--
ALTER TABLE `app_modulos_negocio_rol`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `caja`
--
ALTER TABLE `caja`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `compras`
--
ALTER TABLE `compras`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `compras_items`
--
ALTER TABLE `compras_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `domicilios`
--
ALTER TABLE `domicilios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `egresos`
--
ALTER TABLE `egresos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT de la tabla `empleados`
--
ALTER TABLE `empleados`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `inventario`
--
ALTER TABLE `inventario`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `inventario_fisico`
--
ALTER TABLE `inventario_fisico`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `inventario_fisico_detalles`
--
ALTER TABLE `inventario_fisico_detalles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `mesas`
--
ALTER TABLE `mesas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `movimientos_inventario`
--
ALTER TABLE `movimientos_inventario`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `negocios`
--
ALTER TABLE `negocios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `pagos`
--
ALTER TABLE `pagos`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=176;

--
-- AUTO_INCREMENT de la tabla `personas`
--
ALTER TABLE `personas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT de la tabla `productos_imagenes`
--
ALTER TABLE `productos_imagenes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `productos_precios`
--
ALTER TABLE `productos_precios`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `producto_insumo`
--
ALTER TABLE `producto_insumo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `reservas`
--
ALTER TABLE `reservas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `ubicaciones`
--
ALTER TABLE `ubicaciones`
  MODIFY `id_ubicacion` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT de la tabla `ventas`
--
ALTER TABLE `ventas`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=218;

--
-- AUTO_INCREMENT de la tabla `ventas_items`
--
ALTER TABLE `ventas_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=534;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `app_modulos_negocio`
--
ALTER TABLE `app_modulos_negocio`
  ADD CONSTRAINT `app_modulos_negocio_ibfk_1` FOREIGN KEY (`id_negocio`) REFERENCES `negocios` (`id`),
  ADD CONSTRAINT `app_modulos_negocio_ibfk_2` FOREIGN KEY (`id_modulo`) REFERENCES `app_modulos` (`id`);

--
-- Filtros para la tabla `app_modulos_negocio_rol`
--
ALTER TABLE `app_modulos_negocio_rol`
  ADD CONSTRAINT `app_modulos_negocio_rol_ibfk_1` FOREIGN KEY (`id_app_modulos_negocio`) REFERENCES `app_modulos_negocio` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `caja`
--
ALTER TABLE `caja`
  ADD CONSTRAINT `fk_caja_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD CONSTRAINT `fk_categorias_negocio` FOREIGN KEY (`id_negocio`) REFERENCES `negocios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `compras`
--
ALTER TABLE `compras`
  ADD CONSTRAINT `compras_ibfk_1` FOREIGN KEY (`id_negocio`) REFERENCES `negocios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `compras_ibfk_2` FOREIGN KEY (`id_proveedor`) REFERENCES `personas` (`id`);

--
-- Filtros para la tabla `domicilios`
--
ALTER TABLE `domicilios`
  ADD CONSTRAINT `domicilios_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `domicilios_ibfk_2` FOREIGN KEY (`negocio_id`) REFERENCES `negocios` (`id`);

--
-- Filtros para la tabla `egresos`
--
ALTER TABLE `egresos`
  ADD CONSTRAINT `fk_egreso_caja` FOREIGN KEY (`id_caja`) REFERENCES `caja` (`id`),
  ADD CONSTRAINT `fk_egreso_negocio` FOREIGN KEY (`id_negocio`) REFERENCES `negocios` (`id`);

--
-- Filtros para la tabla `empleados`
--
ALTER TABLE `empleados`
  ADD CONSTRAINT `empleados_ibfk_1` FOREIGN KEY (`negocio_id`) REFERENCES `negocios` (`id`),
  ADD CONSTRAINT `empleados_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `mesas`
--
ALTER TABLE `mesas`
  ADD CONSTRAINT `fk_ventas_negocios` FOREIGN KEY (`id_negocio`) REFERENCES `negocios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `productos`
--
ALTER TABLE `productos`
  ADD CONSTRAINT `fk_productos_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `productos_precios`
--
ALTER TABLE `productos_precios`
  ADD CONSTRAINT `fk_productos_precios_productos` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `producto_insumo`
--
ALTER TABLE `producto_insumo`
  ADD CONSTRAINT `producto_insumo_ibfk_1` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id`),
  ADD CONSTRAINT `producto_insumo_ibfk_2` FOREIGN KEY (`id_insumo`) REFERENCES `productos` (`id`);

--
-- Filtros para la tabla `reservas`
--
ALTER TABLE `reservas`
  ADD CONSTRAINT `reservas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `reservas_ibfk_2` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`),
  ADD CONSTRAINT `reservas_ibfk_3` FOREIGN KEY (`negocio_id`) REFERENCES `negocios` (`id`),
  ADD CONSTRAINT `reservas_ibfk_4` FOREIGN KEY (`mesa_id`) REFERENCES `mesas` (`id`);

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `fk_usuarios_persona` FOREIGN KEY (`id_persona`) REFERENCES `personas` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `usuarios_fk_negocio` FOREIGN KEY (`id_negocio`) REFERENCES `negocios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `ventas`
--
ALTER TABLE `ventas`
  ADD CONSTRAINT `fk_ventas_mesas` FOREIGN KEY (`id_mesa`) REFERENCES `mesas` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ventas_ibfk_2` FOREIGN KEY (`id_cliente`) REFERENCES `personas` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
