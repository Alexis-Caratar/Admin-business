-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 11-12-2025 a las 18:43:20
-- Versión del servidor: 10.4.27-MariaDB
-- Versión de PHP: 8.2.0

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
(8, 8, 'admin', 1, '2025-12-07 23:23:30', '2025-12-07 23:23:30');

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
(7, 23, '12000.00', 'CERRADA', '2025-12-10 18:20:45', '2025-12-10 18:33:00', '12000.00', NULL),
(8, 23, '520000.00', 'CERRADA', '2025-12-10 18:36:58', '2025-12-10 19:07:09', '520000.00', NULL),
(9, 30, '454654.00', 'ABIERTA', '2025-12-10 19:08:24', NULL, NULL, NULL),
(10, 23, '420000.00', 'CERRADA', '2025-12-10 19:09:08', '2025-12-11 09:09:34', '420000.00', NULL),
(11, 23, '452000.00', 'CERRADA', '2025-12-10 19:37:13', '2025-12-11 09:09:24', '452000.00', NULL),
(12, 23, '52000.00', 'CERRADA', '2025-12-11 09:14:57', '2025-12-11 09:42:36', '52000.00', NULL),
(13, 23, '24000.00', 'CERRADA', '2025-12-11 09:45:20', '2025-12-11 11:20:14', '101700.00', NULL),
(14, 23, '320000.00', 'ABIERTA', '2025-12-11 11:20:37', NULL, NULL, NULL);

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
(1, 12, 1, NULL, '15.00', '12.00', 'Gaseosas', '2025-11-20 17:51:16'),
(2, 12, 2, NULL, '50.00', '30.00', 'pollo al clima', '2025-11-20 17:53:05');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mesas`
--

CREATE TABLE `mesas` (
  `id` int(11) NOT NULL,
  `negocio_id` int(11) NOT NULL,
  `nombre` varchar(50) DEFAULT NULL,
  `capacidad` int(11) NOT NULL DEFAULT 2,
  `estado` enum('activa','inactiva') DEFAULT 'activa'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `metodo_pago` varchar(20) NOT NULL CHECK (`metodo_pago` in ('efectivo','tarjeta','transferencia')),
  `monto_pagado` decimal(10,2) DEFAULT NULL,
  `monto_recibido` decimal(10,2) DEFAULT NULL,
  `cambio` int(11) NOT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pagos`
--

INSERT INTO `pagos` (`id`, `id_venta`, `metodo_pago`, `monto_pagado`, `monto_recibido`, `cambio`, `fecha`) VALUES
(4, 29, 'EFECTIVO', '150000.00', '200000.00', 50000, '2025-12-11 16:48:08'),
(5, 30, 'EFECTIVO', '77700.00', '180000.00', 102300, '2025-12-11 16:50:42'),
(6, 35, 'EFECTIVO', '77700.00', '520000.00', 442300, '2025-12-11 17:13:33'),
(7, 36, 'EFECTIVO', '77700.00', '1200000.00', 1122300, '2025-12-11 17:25:17');

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
(1, 'CC', '1233194302', 'perez', 'Caratar Pabon', 'cliente', 'ing@alexis@gmail.com', '3162467600', 'Torres san luis', 'Administrador', '2025-11-17 21:14:32'),
(13, 'CC', '9879878', 'juan', 'perez', 'cliente', NULL, '87687687', 'pasto', NULL, '2025-11-18 04:12:06'),
(14, 'CC', '1233194305', 'alexistos', 'asdad', 'cliente', NULL, '3162467600', 'manzana O casa 18', NULL, '2025-11-21 16:17:03'),
(15, 'CC', '97415439', 'Sara Maria ', 'Pabon Riascos', 'cliente', NULL, '3146027224', 'manzana O casa 18', NULL, '2025-11-21 16:17:35'),
(16, 'CC', '1233194301', 'Yohan Alexis ', 'Caratar Pabon', 'cliente', NULL, '3162467600', 'Torres san luis', NULL, '2025-11-21 16:43:43'),
(17, 'CC', '345345', 'dfgdfg', 'dfgdf', 'cliente', NULL, 'dfgdfg', 'dfgdfg', NULL, '2025-11-21 20:04:25'),
(18, 'CC', '00000000', 'CLIENTE', 'VARIOS', 'cliente', 'clientevarios@gmail.com', '0000000', 'San juan de Pasto', NULL, '2025-12-11 00:21:56');

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
(1, '123456789', 'Pollo en salsa', 'Almuerzo de pollo con salsa de la casa, 1/4 de pollo broster acompañado de delicioso jugo 2', 'litro', 1, 'producto_terminado', 0, 0, 0, 1, 0, '2025-11-28 14:30:28', '2025-11-28 16:15:40'),
(3, NULL, 'Desayuno Casero', 'Un dato es una representación simbólica de un atributo o variable cuantitativa o cualitativa.', 'litro', 2, 'producto_terminado', 0, 0, 0, 1, 0, '2025-11-28 14:30:28', '2025-11-28 14:30:28'),
(9, NULL, 'Plato de almuerzo', 'almuerzo', 'pieza', 3, 'producto_terminado', 0, 0, 0, 1, 0, '2025-11-28 14:30:28', '2025-11-28 14:30:28'),
(10, '464565', 'Bandeja paisa', 'Bandeja paisa', 'kg', 1, 'producto_terminado', 0, 0, 0, 2, 0, '2025-11-28 17:40:15', '2025-11-28 18:38:41'),
(14, '869749465465', 'filte de pollo', 'pollo en filites', 'pieza', 4, 'producto_terminado', 50, 10, 80, 1, 0, '2025-12-02 17:00:32', '2025-12-02 17:15:13'),
(15, '45645', 'costilla ahumada', 'porcion de costilla ahumada de 100 gramos ', 'kg', 4, 'insumo', 45, 50, 60, 1, 0, '2025-12-03 16:46:52', '2025-12-03 16:46:52');

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
(1, 1, 'https://www.renypicot.es/wp-content/uploads/2021/11/2.jpg', 1, 1),
(2, 1, 'https://static.bainet.es/clip/27fb5aa6-a019-4edb-88fd-801212bae27d_source-aspect-ratio_1600w_0.jpg', 2, 1),
(3, 1, 'https://comedera.com/wp-content/uploads/sites/9/2024/11/shutterstock_309154157.jpg?fit=720,480&crop=0px,38px,720px,404px', 3, 1),
(4, 10, 'https://buenprovecho.hn/wp-content/uploads/2023/07/Diseno-sin-titulo-3.png', 0, 1),
(5, 10, 'https://img.freepik.com/premium-photo/traditional-colombian-food-bandeja-paisa-restaurant_843415-843.jpg?w=2000', 1, 1),
(6, 10, 'https://i.pinimg.com/originals/b7/0c/d9/b70cd941ca2eb17cde99a52f7ea82eef.jpg', 2, 1),
(7, 10, 'https://thumbs.dreamstime.com/z/bandeja-paisa-comida-colombiana-tradicional-con-carne-huevo-pl%C3%A1tano-y-aguacate-165437656.jpg', 3, 1);

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
(1, 1, '57000.00', '82000.00', '6000.00', '78000.00', '0.00', '0.00', NULL, NULL, 1, NULL, '2025-11-28 17:16:37'),
(3, 10, '45000.00', '520000.00', '0.00', '0.00', '0.00', '0.00', NULL, NULL, 0, NULL, '2025-11-28 18:26:52'),
(4, 14, '2500.00', '2700.00', '0.00', '0.00', '0.00', '0.00', NULL, NULL, 0, NULL, '2025-12-02 17:00:32'),
(5, 15, '25000.00', '75000.00', '0.00', '0.00', '0.00', '0.00', NULL, NULL, 0, NULL, '2025-12-03 16:46:52');

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
(31, 16, 'yohan4301@gmail.com', '$2b$10$.3aj8d0HeKDz.RuPqxMYOeUPtblOjueD2e2/EZxaxUR0nwNTaqZui', 'admin', 1, '2025-11-21 16:43:43', 'https://e7.pngegg.com/pngimages/340/946/png-clipart-avatar-user-computer-icons-software-developer-avatar-child-face-thumbnail.png');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas`
--

CREATE TABLE `ventas` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `id_caja` int(11) NOT NULL,
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

INSERT INTO `ventas` (`id`, `id_cliente`, `id_caja`, `fecha`, `subtotal`, `descuento`, `descuento_porcentaje`, `impuesto`, `total`, `estado`, `metodo_pago`, `nota`) VALUES
(29, 18, 14, '2025-12-11 16:48:08', '150000.00', '0.00', '0.00', '0.00', '150000.00', 'PENDIENTE', 'EFECTIVO', ''),
(30, 16, 14, '2025-12-11 16:50:42', '77700.00', '0.00', '0.00', '0.00', '77700.00', 'PENDIENTE', 'EFECTIVO', ''),
(35, 1, 14, '2025-12-11 17:13:33', '77700.00', '0.00', '0.00', '0.00', '77700.00', 'PENDIENTE', 'EFECTIVO', ''),
(36, 18, 14, '2025-12-11 17:25:17', '77700.00', '0.00', '0.00', '0.00', '77700.00', 'PENDIENTE', 'EFECTIVO', '');

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
(49, 29, 15, '2.00', '75000.00', '0.00', '0.00', '0.00', '150000.00'),
(50, 30, 14, '1.00', '2700.00', '0.00', '0.00', '0.00', '2700.00'),
(51, 30, 15, '1.00', '75000.00', '0.00', '0.00', '0.00', '75000.00'),
(56, 35, 15, '1.00', '75000.00', '0.00', '0.00', '0.00', '75000.00'),
(57, 35, 14, '1.00', '2700.00', '0.00', '0.00', '0.00', '2700.00'),
(58, 36, 14, '1.00', '2700.00', '0.00', '0.00', '0.00', '2700.00'),
(59, 36, 15, '1.00', '75000.00', '0.00', '0.00', '0.00', '75000.00');

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
  ADD KEY `negocio_id` (`negocio_id`);

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
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo_barra` (`codigo_barra`),
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
  ADD KEY `usuarios_fk_negocio` (`id_negocio`),
  ADD KEY `fk_usuarios_persona` (`id_persona`);

--
-- Indices de la tabla `ventas`
--
ALTER TABLE `ventas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_cliente` (`id_cliente`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `caja`
--
ALTER TABLE `caja`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

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
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `personas`
--
ALTER TABLE `personas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `productos_imagenes`
--
ALTER TABLE `productos_imagenes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `productos_precios`
--
ALTER TABLE `productos_precios`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT de la tabla `ventas`
--
ALTER TABLE `ventas`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT de la tabla `ventas_items`
--
ALTER TABLE `ventas_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

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
-- Filtros para la tabla `empleados`
--
ALTER TABLE `empleados`
  ADD CONSTRAINT `empleados_ibfk_1` FOREIGN KEY (`negocio_id`) REFERENCES `negocios` (`id`),
  ADD CONSTRAINT `empleados_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `mesas`
--
ALTER TABLE `mesas`
  ADD CONSTRAINT `mesas_ibfk_1` FOREIGN KEY (`negocio_id`) REFERENCES `negocios` (`id`);

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
  ADD CONSTRAINT `ventas_ibfk_2` FOREIGN KEY (`id_cliente`) REFERENCES `personas` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
