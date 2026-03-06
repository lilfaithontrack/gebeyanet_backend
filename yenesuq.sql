-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 13, 2024 at 07:04 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `yenesuq`
--

-- --------------------------------------------------------

--
-- Table structure for table `addproduct`
--

CREATE TABLE `addproduct` (
  `id` int(11) NOT NULL,
  `title` text NOT NULL,
  `sku` text NOT NULL,
  `color` text NOT NULL,
  `size` text NOT NULL,
  `brand` text NOT NULL,
  `price` text NOT NULL,
  `image` text NOT NULL,
  `description` text NOT NULL,
  `category` text NOT NULL,
  `ordered_at` datetime DEFAULT convert_tz(utc_timestamp(),'+00:00','+03:00'),
  `quantity` int(11) DEFAULT 30,
  `Active_Quantity` int(11) DEFAULT `quantity`,
  `verification` int(11) DEFAULT 1,
  `status` text DEFAULT 'Avialable',
  `seller_email` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `addproduct`
--

INSERT INTO `addproduct` (`id`, `title`, `sku`, `color`, `size`, `brand`, `price`, `image`, `description`, `category`, `ordered_at`, `quantity`, `Active_Quantity`, `verification`, `status`, `seller_email`) VALUES
(69, 'ቃርያ', 'ቃርያ', 'No-Color', 'none', 'Farm', '140', '[\"th (4).jpeg\",\"th (3).jpeg\",\"th (2).jpeg\",\"th (1).jpeg\"]', 'Staright out from The farm', 'Asbeza', '2024-08-23 17:04:51', 1004, 1000, 1, 'Available', ''),
(70, 'ነጭ ሽንኩርት', 'ነጭ ሽንኩርት', 'No-Color', 'All', 'Farm', '290', '[\"th (8).jpeg\"]', 'Nice and Fresh', 'Asbeza', '2024-08-23 23:03:58', 1112, 1000, 1, 'Available', ''),
(71, 'ምስር', 'ምስር', 'No-Color', 'All', 'Farm', '155', '[\"th (12).jpeg\",\"th (11).jpeg\",\"th (10).jpeg\",\"th (9).jpeg\"]', 'Nice and Fresh', 'Asbeza', '2024-08-23 23:10:43', 998, 1000, 1, 'Available', ''),
(72, 'ሀባብ ', 'ሀባብ', 'No-Color', 'All', 'Farm', '50', '[\"th (16).jpeg\",\"th (15).jpeg\",\"th (14).jpeg\",\"th (13).jpeg\"]', 'Fresh from the farm', 'Asbeza', '2024-08-26 06:55:13', 1008, 1000, 1, 'Available', ''),
(73, 'በርበሬ ዛላ ', 'በርበሬ ዛላ', 'No-Color', 'All', 'Farm', '320', '[\"th (22).jpeg\",\"th (20).jpeg\",\"th (21).jpeg\",\"th (18).jpeg\"]', 'From the farm', 'Asbeza', '2024-08-26 06:57:44', 1047, 1000, 1, 'Available', ''),
(74, 'Red onion  ቀይ ሽንኩርት', 'Red onion', 'No-Color', 'k.g', 'yenesuq', '100', '[\"benefits-of-onions-1536x1239.jpg\",\"red_onions_opt (1).jpg\",\"red_onions_opt.jpg\",\"Set-1000.jpg\"]', 'Red onions are medium to large in size, typically round or oval-shaped. They have a deep purple-red outer skin and a white inner flesh, which has a mild, sweet flavor. When sliced, red onions reveal vibrant layers that are often used to add color and crunch to salads, sandwiches, and various dishes. They are known for their crisp texture and can be eaten raw or cooked, with their flavor becoming sweeter when sautéed', 'Asbeza', '2024-09-27 11:14:12', 9998, 10000, 1, 'Avialable', ''),
(75, 'Tomato  ቲማቲም', 'Tomato  ቲማቲም', 'No-Color', 'k.g', 'yenesuq', '70', '[\"6023619765408482300.jpg\",\"6023619765408482302.jpg\",\"6024034938422150016.jpg\",\"6024034938422150023.jpg\"]', 'Tomatoes are plump, juicy fruits that come in a variety of shapes and sizes, including round, oval, and heirloom. Their skin can range from bright red to yellow, orange, or even purple, depending on the variety. Inside, tomatoes are filled with succulent, seed-filled flesh that offers a balanced flavor of sweetness and acidity. They are versatile and can be eaten raw in salads, sliced on sandwiches, or cooked in sauces, soups, and stews. Rich in vitamins, particularly vitamin C and antioxidants, tomatoes are a staple in many cuisines around the world.', 'Asbeza', '2024-09-27 11:16:37', 9998, 10000, 1, 'Avialable', ''),
(76, 'Potato  ድንች', 'Potato  ድንች', 'No-Color', 'k.g', 'yenesuq', '30', '[\"iC7HBvohbJqExqvbKcV3pP-1200-80.jpg\",\"OIP.jfif\",\"R (1).jfif\",\"thumb-1920-376174.jpg\"]', 'Potatoes are starchy, tuberous vegetables with a round or oval shape and smooth to rough skin that can vary in color from brown and tan to red, purple, or yellow. The flesh inside ranges from white to yellow or even purple, depending on the variety. Potatoes have a mild, earthy flavor and are incredibly versatile, used in a wide range of dishes. They can be boiled, mashed, baked, fried, or roasted, making them a staple in many cuisines. Rich in carbohydrates, potatoes are also a good source of fiber, vitamins, and minerals like potassium.', 'Asbeza', '2024-09-27 11:20:13', 9999, 10000, 1, 'Avialable', ''),
(77, 'Carrot  ካሮት', 'Carrot  ካሮት', 'No-Color', 'k.g', 'yenesuq', '50', '[\"6023619765408482358.jpg\",\"6024034938422150021.jpg\",\"6024034938422150027 (1).jpg\",\"6024034938422150027.jpg\"]', 'Carrots are long, tapering root vegetables with a crunchy texture and vibrant orange color, though they can also be found in purple, yellow, red, and white varieties. They have a slightly sweet, earthy flavor, especially when eaten raw, and become even sweeter when cooked. Carrots are highly nutritious, rich in beta-carotene, which the body converts to vitamin A, and are also a good source of fiber, vitamins, and antioxidants. Commonly used in salads, soups, stews, and as a side dish, carrots are versatile and can be eaten raw, steamed, roasted, or juiced.', 'Asbeza', '2024-09-27 11:23:14', 9996, 10000, 1, 'Available', ''),
(79, 'Avocado  አቭካዶ', 'avocado', 'No-Color', 'k.g', 'yenesuq', '60', '[\"6023619765408482292 (1).jpg\",\"6023619765408482292.jpg\",\"6023619765408482294 (1).jpg\",\"6023619765408482294.jpg\"]', 'Avocados are creamy, pear-shaped fruits with a thick, dark green or nearly black skin and a large central seed. Inside, the flesh is smooth, pale green, and buttery with a rich, slightly nutty flavor. Known for their high content of healthy fats, particularly heart-friendly monounsaturated fats, avocados are also packed with fiber, vitamins, and minerals like potassium.', 'Asbeza', '2024-09-27 11:27:59', 9999, 10000, 1, 'Available', ''),
(80, 'Beet root  ቀይስር ', 'Beet root', 'Black', 'kg', 'yenie suq', '70', '[\"beetroot-3590359_1920.jpg\",\"beetroot-scaled.jpg\",\"Beetroot.jpg\",\"OIP.jpeg\"]', '**Beetroot** is the taproot portion of the beet plant, scientifically known as *Beta vulgaris*. It is commonly deep red or purple in color, although yellow, white, and striped varieties also exist. Beetroot is a nutrient-dense vegetable, rich in vitamins and minerals such as folate, potassium, iron, and vitamin C. It is also a good source of dietary fiber and antioxidants, particularly betalains, which give it its vibrant color and offer anti-inflammatory and detoxifying properties.\\\\r\\\\n\\\\r\\\\nBeetroot is commonly used in salads, juices, soups (like borscht), and as a natural food dye. It\\\\\\\'s often boiled, roasted, or consumed raw. In addition to its culinary uses, beetroot has been praised for its potential health benefits, including improved blood pressure regulation, enhanced exercise performance, and support for liver health due to its high nitrate content.\\\\r\\\\n\\\\r\\\\nIts earthy, slightly sweet flavor makes it versatile in both savory and sweet dishes, and its juice is often used as a natural supplement to boost athletic performance and support cardiovascular health.', 'Asbeza', '2024-09-30 07:25:31', 3000, 3000, 1, 'Avialable', ''),
(81, 'Cabbage   ጥቅል ገመን 35', 'Beet root', 'Black', 'kg', 'yenie suq', '35', '[\"Fresh-Cabbage-2-scaled.jpg\",\"Cabbage2-scaled.jpg\",\"OIP (2).jpeg\",\"OIP (1).jpeg\"]', 'Cabbage is a leafy vegetable from the Brassica family, which includes broccoli, cauliflower, and kale. Its scientific name is Brassica oleracea, and it comes in various types, including green, red (or purple), and Savoy cabbage.', 'Asbeza', '2024-09-30 07:30:25', 3000, 3000, 1, 'Avialable', ''),
(82, 'Papaya   ፓፓያ', 'papaye', 'Black', 'kg', 'yenie suq', '60', '[\"7866-PAPAYE-min-1-1920x1080.jpg\",\"papaye.jpg\",\"papaye-2 (1).jpg\",\"papaye-2.jpg\",\"R (1).jpeg\"]', 'Papaya (Carica papaya) is a tropical fruit known for its sweet, slightly tangy flavor and soft, juicy texture. ', 'Asbeza', '2024-09-30 07:47:38', 3000, 3000, 1, 'Avialable', ''),
(83, 'Broccoil  ብሮክሊ ', 'Broccoil  ብሮክሊ ', 'No-Color', 'kg', 'yenie suq', '85', '[\"how-much-is-in-a-broccoli-1.jpg\",\"p7_Broccoli_HH1812_gi905351392.jpg\",\"wso4wfiBquHB7EupUAZvbb.jpg\",\"broccoli-florets.webp\",\"__opt__aboutcom__coeus__resources__content_migration__simply_recipes__uploads__2006__01__steamed-broccoli-horiz-b-2000-9c966360d0ad47a29120d700906697d9.jpg\",\"R (2).jpeg\"]', 'Broccoli is a cruciferous vegetable known for its distinctive tree-like shape and dark green color. It\\\'s a popular choice among health-conscious individuals due to its high nutritional value and potential health benefits.', 'Asbeza', '2024-09-30 07:52:12', 3000, 3000, 1, 'Avialable', ''),
(84, 'Apple   አፓል 5 ፍሬ', 'የኔ', 'No-Color', 'kg', 'yenie suq', '400', '[\"6023619765408482317 (1) - Copy.jpg\",\"6023619765408482317 (1).jpg\",\"6023619765408482317.jpg\",\"6024034938422150006.jpg\"]', 'Apples are a delicious and nutritious fruit that can be enjoyed in many ways. Their versatility and health benefits make them a popular choice for people of all ages.', 'Asbeza', '2024-09-30 08:16:08', 3000, 3000, 1, 'Avialable', '');

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id` int(11) NOT NULL,
  `name` text NOT NULL,
  `email` text NOT NULL,
  `password` text NOT NULL,
  `image` text DEFAULT 'admin1.jpg',
  `message_count` int(11) DEFAULT 0,
  `role` enum('admin') DEFAULT 'admin',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`id`, `name`, `email`, `password`, `image`, `message_count`, `role`, `created_at`, `updated_at`) VALUES
(1, 'Kasahun kefyalew', 'kasahunkefyalew42@gmail.com', 'Kass123@#', 'admin1.jpg', 27, 'admin', '2024-10-13 17:00:37', '2024-10-13 17:00:38'),
(2, 'Tigist Adefres', 'tigist@yenesuq.com', 'yene321@#', '', 27, 'admin', '2024-10-13 17:00:37', '2024-10-13 17:00:38');

-- --------------------------------------------------------

--
-- Table structure for table `ads`
--

CREATE TABLE `ads` (
  `id` int(11) NOT NULL,
  `image` text NOT NULL,
  `image1` text NOT NULL,
  `image2` text NOT NULL,
  `image3` text NOT NULL,
  `image4` text NOT NULL,
  `image5` text NOT NULL,
  `image6` text NOT NULL,
  `image7` text NOT NULL,
  `image8` text NOT NULL,
  `image9` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `ads`
--

INSERT INTO `ads` (`id`, `image`, `image1`, `image2`, `image3`, `image4`, `image5`, `image6`, `image7`, `image8`, `image9`) VALUES
(1, '[\"cbe3.jpg\",\"cap5.webp\",\"cap4.webp\",\"cap3.jpeg\",\"cap2.jpeg\"]', '', '', '', '', '', '', '', '', ''),
(2, '[\"cap5.webp\",\"cap4.webp\",\"cap3.jpeg\",\"cap2.jpeg\",\"cap1.jpg\"]', '', '', '', '', '', '', '', '', ''),
(3, '[\"cap4.webp\",\"cap3.jpeg\",\"cap2.jpeg\",\"cap1.jpg\"]', 'sweater4.webp', 'cap5.webp', 'cap2.jpeg', 'sweater3.webp', 'cap3.jpeg', 'cap3.jpeg', 'sweater2.webp', 'cap1.jpg', 'sweater2.webp'),
(4, '{\"image1\":\"cap5.webp\",\"image2\":\"cap2.jpeg\",\"image3\":\"cap2.jpeg\",\"image4\":\"sweater4.webp\",\"image5\":\"cap2.jpeg\",\"image6\":\"cap4.webp\",\"image7\":\"sweater4.webp\",\"image8\":\"sweater1.jpeg\",\"image9\":\"sweater3.webp\"}', 'cap5.webp', 'cap2.jpeg', 'cap2.jpeg', 'sweater4.webp', 'cap2.jpeg', 'cap4.webp', 'sweater4.webp', 'sweater1.jpeg', 'sweater3.webp'),
(5, '{\"image1\":\"cap3.jpeg\",\"image2\":\"cap1.jpg\",\"image3\":\"sweater3.webp\",\"image4\":\"sweater3.webp\",\"image5\":\"cap5.webp\",\"image6\":\"sweater1.jpeg\",\"image7\":\"cap1.jpg\",\"image8\":\"cap3.jpeg\",\"image9\":\"potato4.jpeg\"}', 'cap3.jpeg', 'cap1.jpg', 'sweater3.webp', 'sweater3.webp', 'cap5.webp', 'sweater1.jpeg', 'cap1.jpg', 'cap3.jpeg', 'potato4.jpeg'),
(6, '{\"image1\":\"cap3.jpeg\",\"image2\":\"cap1.jpg\",\"image3\":\"sweater3.webp\",\"image4\":\"sweater3.webp\",\"image5\":\"cap5.webp\",\"image6\":\"sweater1.jpeg\",\"image7\":\"cap1.jpg\",\"image8\":\"cap3.jpeg\",\"image9\":\"potato4.jpeg\"}', 'cap3.jpeg', 'cap1.jpg', 'sweater3.webp', 'sweater3.webp', 'cap5.webp', 'sweater1.jpeg', 'cap1.jpg', 'cap3.jpeg', 'potato4.jpeg'),
(7, '{\"image1\":\"cap3.jpeg\",\"image2\":\"cap1.jpg\",\"image3\":\"sweater3.webp\",\"image4\":\"sweater3.webp\",\"image5\":\"cap5.webp\",\"image6\":\"sweater1.jpeg\",\"image7\":\"cap1.jpg\",\"image8\":\"cap3.jpeg\",\"image9\":\"potato4.jpeg\"}', 'cap3.jpeg', 'cap1.jpg', 'sweater3.webp', 'sweater3.webp', 'cap5.webp', 'sweater1.jpeg', 'cap1.jpg', 'cap3.jpeg', 'potato4.jpeg'),
(8, '{\"image1\":\"cap3.jpeg\",\"image2\":\"cap1.jpg\",\"image3\":\"sweater3.webp\",\"image4\":\"sweater3.webp\",\"image5\":\"cap5.webp\",\"image6\":\"sweater1.jpeg\",\"image7\":\"cap1.jpg\",\"image8\":\"cap3.jpeg\",\"image9\":\"potato4.jpeg\"}', 'cap3.jpeg', 'cap1.jpg', 'sweater3.webp', 'sweater3.webp', 'cap5.webp', 'sweater1.jpeg', 'cap1.jpg', 'cap3.jpeg', 'potato4.jpeg'),
(9, '{\"image1\":\"cap3.jpeg\",\"image2\":\"cap1.jpg\",\"image3\":\"sweater3.webp\",\"image4\":\"sweater3.webp\",\"image5\":\"cap5.webp\",\"image6\":\"sweater1.jpeg\",\"image7\":\"cap1.jpg\",\"image8\":\"cap3.jpeg\",\"image9\":\"potato4.jpeg\"}', 'cap3.jpeg', 'cap1.jpg', 'sweater3.webp', 'sweater3.webp', 'cap5.webp', 'sweater1.jpeg', 'cap1.jpg', 'cap3.jpeg', 'potato4.jpeg');

-- --------------------------------------------------------

--
-- Table structure for table `cart`
--

CREATE TABLE `cart` (
  `id` int(11) NOT NULL,
  `title` text NOT NULL,
  `image` text NOT NULL,
  `price` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `cart`
--

INSERT INTO `cart` (`id`, `title`, `image`, `price`) VALUES
(1, 'Potato', 'potato4.jpeg', '200'),
(2, 'Sweat Pants', 'sweatpants4.jpg', '1500'),
(3, 'erwerwre', 'television-tv-png-22246.png', '104');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `category` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `category`) VALUES
(1, 'Asbeza'),
(2, 'Women clos'),
(4, 'Ye Habaseha Libs');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `title` text NOT NULL,
  `image` text NOT NULL,
  `price` text NOT NULL,
  `delivery` text NOT NULL,
  `coupon_code` text NOT NULL,
  `gift_voucher` text NOT NULL,
  `message` text NOT NULL,
  `payment` text NOT NULL,
  `customer_username` text NOT NULL,
  `ordered_at` datetime DEFAULT convert_tz(utc_timestamp(),'+00:00','+03:00'),
  `order_verfication` text NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `username` text NOT NULL,
  `ids` int(11) NOT NULL,
  `color` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `title`, `image`, `price`, `delivery`, `coupon_code`, `gift_voucher`, `message`, `payment`, `customer_username`, `ordered_at`, `order_verfication`, `quantity`, `username`, `ids`, `color`) VALUES
(561, 'ነጭ ሽንኩርት', 'th (8).jpeg', '290', '', '', '', '', '', '', '2024-08-27 16:51:18', '', 41, 'Kefyalew', 70, 'No-Color'),
(562, 'በርበሬ ዛላ ', 'th (22).jpeg', '320', '', '', '', '', '', '', '2024-08-27 16:51:28', '', 18, 'Kefyalew', 73, 'No-Color'),
(565, 'በርበሬ ዛላ ', 'th (22).jpeg', '320', '', '', '', '', '', '', '2024-08-29 12:49:05', '', 18, 'Tesfa', 73, 'No-Color'),
(566, 'ምስር', 'th (12).jpeg', '155', '', '', '', '', '', '', '2024-08-29 12:49:18', '', 3, 'Tesfa', 71, 'No-Color'),
(571, 'ሀባብ ', 'th (16).jpeg', '50', '', '', '', '', '', '', '2024-08-29 16:02:54', '', 9, 'bezawitbelhu@gmail.com', 72, 'No-Color'),
(572, 'ምስር', 'th (12).jpeg', '155', '', '', '', '', '', '', '2024-08-30 10:23:47', '', 3, 'Dj sami', 71, 'No-Color'),
(576, 'በርበሬ ዛላ ', 'th (22).jpeg', '320', '', '', '', '', '', '', '2024-08-30 14:54:58', '', 18, 'Sip21', 73, 'No-Color'),
(578, 'ቃርያ', 'th (4).jpeg', '140', '', '', '', '', '', '', '2024-09-02 00:06:24', '', 3, 'Dj sami', 69, 'No-Color'),
(579, 'ሀባብ ', 'th (16).jpeg', '50', '', '', '', '', '', '', '2024-09-05 15:55:29', '', 9, 'Kefyalew', 72, 'No-Color'),
(580, 'ምስር', 'th (12).jpeg', '155', '', '', '', '', '', '', '2024-09-05 15:55:49', '', 3, 'Kefyalew', 71, 'No-Color'),
(582, 'ሀባብ ', 'th (16).jpeg', '50', '', '', '', '', '', '', '2024-09-14 07:07:46', '', 9, 'Dilnesa', 72, 'No-Color'),
(583, 'ሀባብ ', 'th (16).jpeg', '50', '', '', '', '', '', '', '2024-09-16 12:15:15', '', 9, 'amanumite2@gmail.com', 72, 'No-Color'),
(584, 'በርበሬ ዛላ ', 'th (22).jpeg', '320', '', '', '', '', '', '', '2024-09-17 06:40:06', '', 18, 'Abe', 73, 'No-Color'),
(585, 'ምስር', 'th (12).jpeg', '155', '', '', '', '', '', '', '2024-09-17 06:40:14', '', 3, 'Abe', 71, 'No-Color'),
(588, 'በርበሬ ዛላ ', 'th (22).jpeg', '320', '', '', '', '', '', '', '2024-09-20 19:51:17', '', 18, 'Kasahun', 73, 'No-Color'),
(589, 'ቃርያ', 'th (4).jpeg', '140', '', '', '', '', '', '', '2024-09-20 20:14:03', '', 3, 'yenieshw_zeki', 69, 'No-Color'),
(591, 'ቃርያ', 'th (4).jpeg', '140', '', '', '', '', '', '', '2024-09-20 20:15:57', '', 3, '30', 69, 'No-Color'),
(592, 'ምስር', 'th (12).jpeg', '155', '', '', '', '', '', '', '2024-09-21 13:05:20', '', 3, 'Kasahun', 71, 'No-Color'),
(593, 'ነጭ ሽንኩርት', 'th (8).jpeg', '290', '', '', '', '', '', '', '2024-09-21 18:49:01', '', 41, 'Getahun', 70, 'No-Color'),
(594, 'ቃርያ', 'th (4).jpeg', '140', '', '', '', '', '', '', '2024-09-21 18:52:12', '', 3, 'Getahun', 69, 'No-Color'),
(595, 'ምስር', 'th (12).jpeg', '155', '', '', '', '', '', '', '2024-09-21 18:59:10', '', 3, 'Getahun', 71, 'No-Color'),
(599, 'ቃርያ', 'th (4).jpeg', '140', '', '', '', '', '', '', '2024-09-22 23:35:25', '', 3, '30', 69, 'No-Color'),
(608, 'በርበሬ ዛላ ', 'th (22).jpeg', '320', '', '', '', '', '', '', '2024-09-23 09:18:24', '', 18, '30', 73, 'No-Color'),
(613, 'ቃርያ', 'th (4).jpeg', '140', '', '', '', '', '', '', '2024-09-23 09:35:44', '', 3, 'Kasahun', 69, 'No-Color'),
(617, 'በርበሬ ዛላ ', 'th (22).jpeg', '320', '', '', '', '', '', '', '2024-09-23 09:36:30', '', 18, '30', 73, 'No-Color'),
(618, 'በርበሬ ዛላ ', 'th (22).jpeg', '320', '', '', '', '', '', '', '2024-09-23 09:39:05', '', 18, 'yenieshw_zeki', 73, 'No-Color'),
(629, 'ነጭ ሽንኩርት', 'th (8).jpeg', '290', '', '', '', '', '', '', '2024-09-23 13:01:52', '', 41, 'kalebeyasu', 70, 'No-Color'),
(630, 'ነጭ ሽንኩርት', 'th (8).jpeg', '290', '', '', '', '', '', '', '2024-09-23 16:47:50', '', 41, 'Kasahun', 70, 'No-Color'),
(632, 'በርበሬ ዛላ ', 'th (22).jpeg', '320', '', '', '', '', '', '', '2024-09-24 11:24:39', '', 1, '30', 73, 'No-Color'),
(635, 'ሀባብ ', 'th (16).jpeg', '50', '', '', '', '', '', '', '2024-09-24 14:09:36', '', 9, '@tesfamicheal', 72, 'No-Color'),
(636, 'ሀባብ ', 'th (16).jpeg', '50', '', '', '', '', '', '', '2024-09-25 06:24:57', '', 9, 'kalebeyasu', 72, 'No-Color'),
(637, 'ምስር', 'th (12).jpeg', '155', '', '', '', '', '', '', '2024-09-25 06:27:59', '', 1, 'kalebeyasu', 71, 'No-Color'),
(638, 'በርበሬ ዛላ ', 'th (22).jpeg', '320', '', '', '', '', '', '', '2024-09-25 15:46:46', '', 1, '@tesfamicheal', 73, 'No-Color'),
(639, 'ቃርያ', 'th (4).jpeg', '140', '', '', '', '', '', '', '2024-09-26 13:36:58', '', 1, '123', 69, 'No-Color'),
(640, 'ሀባብ ', 'th (16).jpeg', '50', '', '', '', '', '', '', '2024-09-26 13:37:03', '', 9, '123', 72, 'No-Color'),
(647, 'Tomato  ቲማቲም', '6023619765408482300.jpg', '70', '', '', '', '', '', '', '2024-09-28 10:55:43', '', 1, '....❤????????????', 75, 'No-Color'),
(648, 'Red onion  ቀይ ሽንኩርት', 'benefits-of-onions-1536x1239.jpg', '100', '', '', '', '', '', '', '2024-09-28 17:19:19', '', 3, 'Meba', 74, 'No-Color'),
(649, 'Avocado  አቭካዶ', '6023619765408482292 (1).jpg', '60', '', '', '', '', '', '', '2024-09-28 17:19:25', '', 2, 'Meba', 79, 'No-Color'),
(650, 'Carrot  ካሮት', '6023619765408482358.jpg', '50', '', '', '', '', '', '', '2024-09-28 17:19:41', '', 5, 'Meba', 77, 'No-Color'),
(657, 'Carrot  ካሮት', '6023619765408482358.jpg', '50', '', '', '', '', '', '', '2024-09-29 10:30:34', '', 5, '....❤????????????', 77, 'No-Color'),
(658, 'Tomato  ቲማቲም', '6023619765408482300.jpg', '70', '', '', '', '', '', '', '2024-09-29 11:07:32', '', 1, 'amanumite2@gmail.com', 75, 'No-Color'),
(659, 'Red onion  ቀይ ሽንኩርት', 'benefits-of-onions-1536x1239.jpg', '100', '', '', '', '', '', '', '2024-09-29 12:04:59', '', 1, 'girmakmfioperation@gmail.com', 74, 'No-Color'),
(660, 'Broccoil  ብሮክሊ ', 'how-much-is-in-a-broccoli-1.jpg', '85', '', '', '', '', '', '', '2024-09-30 08:01:32', '', 1, '....❤????????????', 83, 'No-Color');

-- --------------------------------------------------------

--
-- Table structure for table `customers_info`
--

CREATE TABLE `customers_info` (
  `id` int(11) NOT NULL,
  `name` text NOT NULL,
  `lname` text NOT NULL,
  `username` text NOT NULL,
  `email` text NOT NULL,
  `tel` text NOT NULL,
  `fax` text NOT NULL,
  `company` text NOT NULL,
  `address` text NOT NULL,
  `city` text NOT NULL,
  `pcode` text NOT NULL,
  `region` text NOT NULL,
  `password` text NOT NULL,
  `subscription` text NOT NULL,
  `image` text DEFAULT 'defaultimage.jpg',
  `time_created` date DEFAULT convert_tz(utc_timestamp(),'+00:00','+03:00'),
  `views` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `customers_info`
--

INSERT INTO `customers_info` (`id`, `name`, `lname`, `username`, `email`, `tel`, `fax`, `company`, `address`, `city`, `pcode`, `region`, `password`, `subscription`, `image`, `time_created`, `views`) VALUES
(1, 'Zeki Sebsib', 'Sebsib', 'as', 'zekariassebsib11@gmail.com', '0941246063', '7', 'private', 'Ferensay', 'Addis Ababa', 'pcod', 'Addis Ababa', '123', 'No', 'edited.jpg', '2024-04-12', 70),
(2, 'zeki', 'Sebsib', 'zeki', 'zekariassebsib1@gmail.com', '0941246063', '34', 'personal', '4 kilo', 'Adama', 'pcode', 'Addis Ababa', '123', 'No', 'defaultimage.jpg', '2024-04-12', 0),
(3, 'zeki', '26', '42', 'zekarisebsib11@gmail.com', '0941246063', '34', 'personal', 'address', 'city', 'pcode', 'Dire Dawa', '123', 'No', 'defaultimage.jpg', '2024-04-22', 0),
(4, 'the', '', 'they', 'them@gmail.com', '092746374', '', '', '', '', '', '', '7890', 'No', 'defaultimage.jpg', '2024-04-22', 11),
(5, 'Kasahun', '', 'Kefyalew', 'kasahunmeba@gmail.com', '0908912323', '', '', '', '', '', '', '232323', 'Yes', 'defaultimage.jpg', '2024-04-23', 30),
(6, 'Kaleb              ', '', '....❤????????????', 'kalu4mom@gmail.com', '0976126977', '', '', '', '', '', '', '12345', 'No', 'Screenshot_20240507-145141_Instagram.jpg', '2024-04-23', 30),
(7, 'BEZI  ', '', 'BEZI', 'bezm@gmail.com', '0976126977', '', '', '', '', '', '', '123', 'No', 'Screenshot_20240324-095508_Pinterest.jpg', '2024-04-28', 0),
(8, 'Aa', '', 'Solo', 'sollomonbellay@gmail.com', '+2519929292', '', '', '', '', '', '', '12345', 'No', 'defaultimage.jpg', '2024-05-09', 1),
(9, 'Ela', '', 'Etnet', 'elam5211@gmail.com', '0924888811', '', '', '', '', '', '', 'etnet1234', 'No', 'defaultimage.jpg', '2024-06-04', 1),
(10, 'Kaleb Eyasu', '', 'Kalu', 'mom@gmail.com', '0976126977', '', '', '', '', '', '', '123', 'No', 'defaultimage.jpg', '2024-06-19', 3),
(11, 'Gojo Music', '', 'goy', 'gojomusic2022@gmail.com', '0976126977', '', '', '', '', '', '', '123', 'No', 'defaultimage.jpg', '2024-06-20', 1),
(12, ' gatasew admas', '', 'admasgatasew@gmail.com', 'admasgatasew@gmail.com', '0944040518', '', '', '', '', '', '', '123456', 'Yes', 'defaultimage.jpg', '2024-06-28', 4),
(13, 'Abebe', '', 'aaaaa', 'alemteb1010@gmail.com', '0967696428', '', '', '', '', '', '', '12345678', 'No', 'defaultimage.jpg', '2024-06-28', 3),
(14, 'Jaleta Mulatu', '', 'jaleta.mulatu@gmail.com', 'jaleta.mulatu@gmail.com', '0944308801', '', '', '', '', '', '', '1344', 'Yes', 'defaultimage.jpg', '2024-07-05', 15),
(15, 'Kaleb Eyasu', '', 'kalu2mom@gmail.com', 'kalu2mom@gmail.com', '0909837925', '', '', '', '', '', '', '123', 'No', 'defaultimage.jpg', '2024-07-07', 1),
(16, 'aklilu', '', 'ak', 'ak@y.com', '0912435678', '', '', '', '', '', '', '123', 'No', 'defaultimage.jpg', '2024-07-07', 1),
(17, 'Lemi', '', 'Tesfaye', 'lemitesfaye103@gmail.com', '0920884547', '', '', '', '', '', '', '642312', 'No', 'defaultimage.jpg', '2024-07-10', 1),
(18, 'Nigisti Teklay', '', 'nigistiteklay69@gmail.com', 'nigistiteklay69@gmail.com', '0926765564', '', '', '', '', '', '', '@123456#', 'No', 'defaultimage.jpg', '2024-07-10', 3),
(19, 'Tsion ', '', 'Tsion', 'tsiontesfaye732@gmail.com', '+251983047821', '', '', '', '', '', '', '0240', 'Yes', 'defaultimage.jpg', '2024-07-13', 1),
(20, 'Etnet', '', 'Et12', 'elam5211@gmail.xom', '0924888811', '', '', '', '', '', '', 'etnet12', 'No', 'defaultimage.jpg', '2024-07-14', 0),
(21, 'Etnet', '', 'Elam', 'fetandesign@gmail.com', '0911052206', '', '', '', '', '', '', 'etnet2323', 'No', 'defaultimage.jpg', '2024-07-14', 1),
(22, 'Genet', '', 'Mignotbc', 'mignotbc@gmail.com', '913574435', '', '', '', '', '', '', 'genet2010', 'No', 'defaultimage.jpg', '2024-07-15', 1),
(23, 'Kaleb Eyasu', '', 'kalu4mom@gmail.com', 'kalmom@gmail.com', '0976126977', '', '', '', '', '', '', '123', 'No', 'defaultimage.jpg', '2024-07-15', 1),
(24, 'Senay', '', 'Senay', 'senaygraphic@gmail.com', '+251975267173', '', '', '', '', '', '', 'qwer1234', 'No', 'defaultimage.jpg', '2024-07-16', 1),
(25, 'Girma', '', 'girmakmfioperation@gmail.com', 'girmakmfioperation@gmail.com', '251907247777', '', '', '', '', '', '', '2434', 'No', 'defaultimage.jpg', '2024-07-17', 3),
(26, 'Netsanet Deneke', '', 'Netsi', 'netsanet2002@gmail.com', '+2519510987', '', '', '', '', '', '', 'Seblenetsa@1', 'No', 'defaultimage.jpg', '2024-07-17', 1),
(27, 'Moges', '', 'Moges', 'sarom2000@gmail.com', '0911381242', '', '', '', '', '', '', 'moges@42', 'No', 'defaultimage.jpg', '2024-07-17', 3),
(28, 'Daniel ', '', '3224', 'danielnigussie84@gmail.com', '251918768707', '', '', '', '', '', '', 'abilala0918711056', 'Yes', 'defaultimage.jpg', '2024-07-20', 2),
(29, 'Aklilu Dilnesa', '', 'Aklil', 'akliludilnesa2@gmail.com', '0911164383', '', '', '', '', '', '', 'Ahbn@@21', 'No', 'defaultimage.jpg', '2024-08-07', 2),
(30, 'landing', '', 'dj_kaleb123', 'ka@g.com', '09123456', '', '', '', '', '', '', '123', 'No', 'defaultimage.jpg', '2024-08-17', 7),
(31, 'Eleni', '', 'Shopper#19', 'dereseleni@gmail.com', '0911769382', '', '', '', '', '', '', 'shopper#19', 'No', 'defaultimage.jpg', '2024-08-29', 1),
(32, 'meseret', '', 'mesiye', 'meseret12354@gmail.com', '0934118733', '', '', '', '', '', '', '12345', 'No', 'defaultimage.jpg', '2024-08-29', 1),
(33, 'Fre Abadi', '', 'Lemenoh', 'lemenohfre30@gmail.com', 'lemenohfre30@gmail.com', '', '', '', '', '', '', 'Melidama@27', 'Yes', 'defaultimage.jpg', '2024-08-29', 1),
(34, 'Tefsa Michael', '', 'Tesfa', 'tesfa@gmail.com', '09155568083', '', '', '', '', '', '', '123456', 'No', 'defaultimage.jpg', '2024-08-29', 2),
(35, 'Bezawit Belhu', '', 'bezawitbelhu@gmail.com', 'bezawitbelhu@gmail.com', '0910853561', '', '', '', '', '', '', 'bezawit123', 'Yes', 'defaultimage.jpg', '2024-08-29', 2),
(36, 'Weldesenbet', '', 'Hagos', 'weldesenbethagos5@gmail.com', '0979404331', '', '', '', '', '', '', 'weldua23', 'No', 'defaultimage.jpg', '2024-08-29', 1),
(37, 'Firmaye', '', 'Phi', 'phyrmayed@gmail.com', '0947898533', '', '', '', '', '', '', '(fucklife@123)', 'No', 'defaultimage.jpg', '2024-08-29', 2),
(38, 'Dj sami', '', 'Dj sami', 'djsamigojo@gmail.com', '+251922147878', '', '', '', '', '', '', '415187', 'No', 'defaultimage.jpg', '2024-08-30', 1),
(39, 'Abel Ababu', '', 'Abela', 'abelababu18@gmail.com', '0933685698', '', '', '', '', '', '', '123456789', 'No', 'defaultimage.jpg', '2024-08-30', 1),
(40, 'Sip', '', 'Sip21', 'siparataye21@gmail.com', '+251911514918', '', '', '', '', '', '', '1234T@p', 'No', 'defaultimage.jpg', '2024-08-30', 2),
(41, 'Aklilu ', '', 'Dilnesa', 'hibirdesign@gmail.com', '0911164383', '', '', '', '', '', '', 'Ahbn@2244', 'No', 'defaultimage.jpg', '2024-09-01', 2),
(42, 'Germachew', '', 'Germasha', 'germa@gmail.com', '0911690379', '', '', '', '', '', '', '1234', 'No', 'defaultimage.jpg', '2024-09-01', 1),
(43, 'Yisack abadir', '', 'yisackabad@gmail.com', 'yisackabad@gmail.com', '0712399616', '', '', '', '', '', '', 'Sing@1212', 'No', 'defaultimage.jpg', '2024-09-04', 0),
(44, 'Habtamu Getachew', '', 'habtamu ', 'habtamug474@gmail.com', '0941583952', '', '', '', '', '', '', '1222', 'No', 'defaultimage.jpg', '2024-09-04', 1),
(45, 'a', '', 'b', 'aaaa@gmail.com', '0977363377', '', '', '', '', '', '', 'eeeeeeee', 'No', 'defaultimage.jpg', '2024-09-07', 1),
(46, 'Mite Amanu', '', 'amanumite2@gmail.com', 'amanumite2@gmail.com', 'amanumite2@gmail.com', '', '', '', '', '', '', '104510', 'No', 'defaultimage.jpg', '2024-09-16', 1),
(47, 'Abebe', '', 'Abe', 'abe@gmail.com', '0911121314', '', '', '', '', '', '', '123456', 'No', 'defaultimage.jpg', '2024-09-17', 1),
(48, 'Eden', '', 'Ed', 'eden.kassahun@ethiotelecom.et', '251930109224', '', '', '', '', '', '', 'ed@10781', 'No', 'defaultimage.jpg', '2024-09-18', 1),
(49, 'Meba', '', 'Kasahun', 'mebakasahun1@gmail.com', '0938911484', '', '', '', '', '', '', '123456', 'Yes', 'defaultimage.jpg', '2024-09-20', 4),
(50, 'kaleb', '', 'kalebeyasu', 'kalebeyasu@gmail.com', '0912734153', '', '', '', '', '', '', 'kalebeyasu', 'No', 'defaultimage.jpg', '2024-09-21', 6),
(51, 'Netsanet', '', 'Getahun', 'netsaget6@gmail.com', '0913442563', '', '', '', '', '', '', 'ne11223344', 'No', 'defaultimage.jpg', '2024-09-21', 2),
(52, 'Worknesh Atinafu', '', 'workneshatinafu12@gmail.com', 'workneshatinafu1221@gmail.com', '251975130371', '', '', '', '', '', '', 'corona@2019', 'No', 'defaultimage.jpg', '2024-09-22', 0),
(53, 'Senait andarge', '', 'senaitandarge56@gmail.com', 'senaitandarge56@gmail.com', 'senaitandarge56@gmail.com', '', '', '', '', '', '', '123456', 'No', 'defaultimage.jpg', '2024-09-22', 0),
(54, 'Aregashe', '', 'Aregashe', 'aregashargash18@gmail.com', '0941582805', '', '', '', '', '', '', '12345678', 'Yes', 'defaultimage.jpg', '2024-09-23', 1),
(55, 'Nati', '', 'Kiros', 'samuelashenafi348@gmail.com', '0938167212', '', '', '', '', '', '', '080808', 'No', 'defaultimage.jpg', '2024-09-24', 2),
(56, 'Tesfamicheal ', '', '@tesfamicheal', 'tesfamichealfetene@gmail.com', '0915568083', '', '', '', '', '', '', '12345', 'No', 'defaultimage.jpg', '2024-09-24', 1),
(57, '8', '', '123', '123@gmail.com', '0123456789', '', '', '', '', '', '', '123', 'No', 'defaultimage.jpg', '2024-09-26', 1),
(58, 'አይናለም', '', 'assefaellu@gmail.com', 'assefaellu@gmail.com', '0912037894', '', '', '', '', '', '', 'goodlove', 'Yes', 'defaultimage.jpg', '2024-09-26', 0),
(59, 'kasahun', '', 'Meba', 'kasahunewenet@gmail.com', '0937903329', '', '', '', '', '', '', '1234', 'Yes', 'defaultimage.jpg', '2024-09-27', 1),
(60, 'Bereket amanuel', '', 'nnatiman59@gmail.com', 'nnatiman59@gmail.com', '0986977860', '', '', '', '', '', '', 'beki123', 'No', 'defaultimage.jpg', '2024-09-27', 1),
(61, 'Garomsa ', '', 'geletagaromsa81@gmail.com', 'geletagaromsa81@gmail.com', '0947370862', '', '', '', '', '', '', '4737', 'No', 'defaultimage.jpg', '2024-09-28', 2),
(62, 'Marelgn tesfaw', '', 'marelgnyemer@gmail.com', 'marelgnyemer@gmail.com', 'marelgnyemer@gmail.com', '', '', '', '', '', '', '6260', 'No', 'defaultimage.jpg', '2024-09-28', 0),
(63, 'Yakob', '', 'Tsegaye', 'yakobetsegaye@yahoo.com', '0913322853', '', '', '', '', '', '', 'Kd161616', 'Yes', 'defaultimage.jpg', '2024-09-28', 1),
(64, 'Asefa', '', 'Tadese', 'asefatades258@gmail.com', '0915549654', '', '', '', '', '', '', '15549654', 'Yes', 'defaultimage.jpg', '2024-09-28', 1);

-- --------------------------------------------------------

--
-- Table structure for table `delivery`
--

CREATE TABLE `delivery` (
  `id` int(11) NOT NULL,
  `username` text NOT NULL,
  `email` text NOT NULL,
  `password` text NOT NULL,
  `image` text DEFAULT 'admin1.jpg'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `delivery`
--

INSERT INTO `delivery` (`id`, `username`, `email`, `password`, `image`) VALUES
(1, 'deliveryman1', 'deliveryman@gmail.com', '123', 'admin1.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `liked`
--

CREATE TABLE `liked` (
  `id` int(11) NOT NULL,
  `username` text NOT NULL,
  `title` text NOT NULL,
  `image` text NOT NULL,
  `price` text NOT NULL,
  `brand` text NOT NULL,
  `description` text NOT NULL,
  `ids` text NOT NULL,
  `color` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `liked`
--

INSERT INTO `liked` (`id`, `username`, `title`, `image`, `price`, `brand`, `description`, `ids`, `color`) VALUES
(12, 'as', 'የካሜራ ሌንስ', '1695894665345.jpg', '70000', 'ካነን', 'ማርክ 2 ካነን ሊንስ', '19', 'Black'),
(13, 'as', 'Sweat Pants', 'sweatpants4.jpg', '1500', 'Southpole Women\\\\\\\'s Basic Fleece Open Bottom Sweatpants', 'These sweatpants from Southpole are designed for ultimate comfort and relaxation. Made from soft fleece material, they\\\\\\\'ll keep you warm and cozy during colder days.', '11', 'Black'),
(16, 'as', 'Shirts', 'shirts5.jpg', '1500', 'Hanes Men\\\\\\\'s T-Shirts, Men\\\\\\\'s BeefyT Henley Shirts, Men\\\\\\\'s Cotton Long Sleeve Shirts', 'It is made from heavyweight, 100% cotton (or cotton/polyester blend for heather colors) for durability. It features a traditional Henley neckline with a 3-button placket. It is built with strong seams thanks to double-needle stitching and shoulder-to-shoulder taping. It offers a comfortable, relaxed fit.', '9', 'Green'),
(21, 'Etnet', 'Shirts', 'shirts5.jpg', '1500', 'Hanes Men\\\\\\\'s T-Shirts, Men\\\\\\\'s BeefyT Henley Shirts, Men\\\\\\\'s Cotton Long Sleeve Shirts', 'It is made from heavyweight, 100% cotton (or cotton/polyester blend for heather colors) for durability. It features a traditional Henley neckline with a 3-button placket. It is built with strong seams thanks to double-needle stitching and shoulder-to-shoulder taping. It offers a comfortable, relaxed fit.', '9', 'Green'),
(24, 'Kefyalew', 'onion ', 'R.jpeg', '50', 'Vegitable', 'it is nice and fresh onion from the farm ', '49', 'No-Color'),
(25, 'Kefyalew', 'tomato ', 'Tomatos.jpg', '30', 'Vegitable', 'nice and fresh from the farm ', '50', 'No-Color'),
(26, 'Elam', 'ሽንኩርት ', 's316008548640775782_p217_i1_w2560.jpeg', '50', 'Farm', 'nice and fresh from the farm', '55', 'No-Color'),
(27, 'Elam', 'ሙዝ', 'OIP (2).jpeg', '40', 'Farm', 'Nice and fresh From the farm', '57', 'No-Color'),
(29, 'jaleta.mulatu@gmail.com', 'ድንች', '1720795775888.jpg', '30', 'አፋር', 'ፍሬሽ ቀጥታ ከገበሬው', '65', 'No-Color'),
(30, 'jaleta.mulatu@gmail.com', 'ሩዝ', 'OIP (5).jpeg', '75', 'Farm', 'Rice', '62', 'No-Color'),
(31, 'Elam', 'ጤፍ', 'OIP (6).jpeg', '130', 'Farm', 'nice and fresh from the farm', '63', 'No-Color'),
(32, 'Kefyalew', 'ፓስታ', 'R (3).jpeg', '80', 'pasta', 'Nice and delicious  pasta for you home', '59', 'No-Color'),
(33, 'bezawitbelhu@gmail.com', 'ሀባብ ', 'th (16).jpeg', '50', 'Farm', 'Fresh from the farm', '72', 'No-Color'),
(35, 'kalebeyasu', 'በርበሬ ዛላ ', 'th (22).jpeg', '320', 'Farm', 'From the farm', '73', 'No-Color');

-- --------------------------------------------------------

--
-- Table structure for table `notification`
--

CREATE TABLE `notification` (
  `id` int(11) NOT NULL,
  `deliveryman` text NOT NULL,
  `ids` text NOT NULL,
  `username` text NOT NULL,
  `code` text NOT NULL,
  `is_read` int(11) DEFAULT 1,
  `message_status` text DEFAULT 'Message Not Recieved',
  `message_sent_at` datetime DEFAULT convert_tz(utc_timestamp(),'+00:00','+03:00'),
  `due_date` date NOT NULL,
  `order_success` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `notification`
--

INSERT INTO `notification` (`id`, `deliveryman`, `ids`, `username`, `code`, `is_read`, `message_status`, `message_sent_at`, `due_date`, `order_success`) VALUES
(16, 'deliveryman1', '52', 'as', 'yene120552', 0, 'Message Received', '2024-05-12 09:38:56', '0000-00-00', ''),
(17, 'deliveryman1', '52', 'as', 'yene120552', 0, 'Message Received', '2024-05-12 09:39:05', '0000-00-00', ''),
(18, 'deliveryman1', '60', 'Kefyalew', 'yene120560', 0, 'Message Received', '2024-05-12 11:14:51', '0000-00-00', ''),
(20, '', '57', 'as', '', 0, 'Message Not Recieved', '2024-05-13 12:54:02', '2024-05-14', ''),
(21, 'deliveryman1', '52', 'as', 'yene130552', 0, 'Message Received', '2024-05-13 13:25:27', '0000-00-00', ''),
(22, '', '57', 'as', '', 0, 'Message Not Recieved', '2024-05-13 13:26:33', '2024-05-16', ''),
(23, 'deliveryman1', '52', 'as', 'yene130552', 0, 'Message Received', '2024-05-13 14:22:33', '0000-00-00', ''),
(24, '', '', '', '', 1, 'Message Not Recieved', '2024-05-13 14:22:47', '0000-00-00', 'Your Order Of 6 የካሜራ ሌንስ Has Been Successfully Completed'),
(25, 'deliveryman1', '52', 'as', 'yene130552', 0, 'Message Received', '2024-05-13 14:29:18', '0000-00-00', ''),
(26, '', '52', 'as', '', 0, 'Message Not Recieved', '2024-05-13 14:31:42', '0000-00-00', 'Your Order Of 6 የካሜራ ሌንስ Has Been Successfully Completed'),
(27, 'deliveryman1', '52', 'as', 'yene140552', 0, 'Message Received', '2024-05-14 12:31:55', '0000-00-00', ''),
(28, '', '', 'as', '', 0, 'Message Not Recieved', '2024-05-14 13:07:31', '0000-00-00', 'Your Order Of 6 የካሜራ ሌንስ Has Been Successfully Completed'),
(29, '', '', 'Kefyalew', '', 0, 'Message Not Recieved', '2024-05-20 18:43:04', '0000-00-00', 'Your Order Of 1 Potato Has Been Successfully Completed'),
(30, '', '73', 'Kefyalew', '', 0, 'Message Not Recieved', '2024-05-22 19:13:25', '2024-05-23', ''),
(31, '', '77', 'Kefyalew', '', 0, 'Message Not Recieved', '2024-06-07 05:05:55', '2024-06-10', ''),
(32, 'deliveryman1', '78', 'Kefyalew', 'yene090678', 0, 'Message Received', '2024-06-09 07:32:38', '0000-00-00', ''),
(33, '', '', 'Kefyalew', '', 0, 'Message Not Recieved', '2024-06-09 07:34:25', '0000-00-00', 'Your Order Of 1 የካሜራ ሌንስ Has Been Successfully Completed'),
(34, 'deliveryman1', '78', 'Kefyalew', 'yene090678', 0, 'Message Received', '2024-06-09 07:37:17', '0000-00-00', ''),
(35, '', '79', 'Kefyalew', '', 0, 'Message Not Recieved', '2024-06-16 12:19:07', '2024-06-16', ''),
(36, '', '80', 'Kefyalew', '', 0, 'Message Not Recieved', '2024-06-16 12:19:22', '2024-06-16', ''),
(37, 'deliveryman1', '81', 'as', 'yene180681', 0, 'Message Received', '2024-06-18 15:06:01', '0000-00-00', ''),
(38, 'deliveryman1', '81', 'as', 'yene180681', 0, 'Message Received', '2024-06-18 15:10:29', '0000-00-00', ''),
(39, '', '', 'as', '', 0, 'Message Not Recieved', '2024-06-18 15:14:39', '0000-00-00', 'Your Order Of 2 Potato Has Been Successfully Completed'),
(40, '', '', 'as', '', 0, 'Message Not Recieved', '2024-06-18 15:14:56', '0000-00-00', 'Your Order Of 2 Potato Has Been Successfully Completed'),
(41, '', '54', 'they', '', 1, 'Message Not Recieved', '2024-06-18 15:22:41', '2024-06-20', ''),
(42, '', '82', '....❤????????????', '', 0, 'Message Not Recieved', '2024-06-20 16:28:38', '2024-06-20', ''),
(43, '', '83', 'Kefyalew', '', 0, 'Message Not Recieved', '2024-06-20 16:28:50', '2024-06-20', ''),
(44, '', '84', 'Kefyalew', '', 0, 'Message Not Recieved', '2024-06-21 13:52:57', '2024-06-21', ''),
(45, '', '85', 'Kefyalew', '', 0, 'Message Not Recieved', '2024-06-21 13:53:05', '2024-06-21', ''),
(46, '', '', 'Kefyalew', '', 0, 'Message Not Recieved', '2024-07-11 13:27:43', '0000-00-00', 'Your Order Of 1 የካሜራ ሌንስ Has Been Successfully Completed'),
(47, '', '87', 'jaleta.mulatu@gmail.com', '', 0, 'Message Not Recieved', '2024-07-15 18:42:18', '2024-07-15', ''),
(48, '', '88', 'jaleta.mulatu@gmail.com', '', 0, 'Message Not Recieved', '2024-07-16 08:20:13', '2024-07-16', ''),
(49, '', '89', 'jaleta.mulatu@gmail.com', '', 0, 'Message Not Recieved', '2024-07-16 08:20:38', '2024-07-16', ''),
(50, '', '90', 'jaleta.mulatu@gmail.com', '', 0, 'Message Not Recieved', '2024-07-16 08:20:53', '2024-07-16', ''),
(51, '', '91', 'Kefyalew', '', 0, 'Message Not Recieved', '2024-07-18 06:12:37', '2024-07-18', ''),
(52, '', '91', 'Kefyalew', '', 0, 'Message Not Recieved', '2024-07-18 12:48:53', '2024-07-18', ''),
(53, 'deliveryman1', '87', 'jaleta.mulatu@gmail.com', 'yene250787', 0, 'Message Received', '2024-07-25 08:33:08', '0000-00-00', ''),
(54, '', '', 'jaleta.mulatu@gmail.com', '', 0, 'Message Not Recieved', '2024-07-25 08:37:52', '0000-00-00', 'Your Order Of 1 Black Dinner Dress Has Been Successfully Completed'),
(55, 'deliveryman1', '62', '....❤????????????', 'yene250762', 0, 'Message Received', '2024-07-25 12:14:47', '0000-00-00', ''),
(56, '', '', '....❤????????????', '', 0, 'Message Not Recieved', '2024-07-25 12:16:30', '0000-00-00', 'Your Order Of 2 Light Weight Strollers Has Been Successfully Completed'),
(57, 'deliveryman1', '98', '....❤????????????', 'yene260798', 0, 'Message Received', '2024-07-26 08:41:37', '0000-00-00', ''),
(58, '', '', '....❤????????????', '', 0, 'Message Not Recieved', '2024-07-26 08:42:13', '0000-00-00', 'Your Order Of 9 ድንች Has Been Successfully Completed'),
(59, '', '99', 'Kefyalew', '', 0, 'Message Not Recieved', '2024-07-27 07:25:32', '2024-07-27', ''),
(60, '', '100', 'Kefyalew', '', 0, 'Message Not Recieved', '2024-07-27 07:25:43', '2024-07-27', ''),
(61, '', '101', 'Kefyalew', '', 0, 'Message Not Recieved', '2024-07-27 07:25:54', '2024-07-27', ''),
(62, 'deliveryman1', '99', 'Kefyalew', 'yene270799', 0, 'Message Received', '2024-07-27 07:46:00', '0000-00-00', ''),
(63, 'deliveryman1', '100', 'Kefyalew', 'yene2707100', 0, 'Message Received', '2024-07-27 07:46:40', '0000-00-00', ''),
(64, 'deliveryman1', '101', 'Kefyalew', 'yene2707101', 0, 'Message Received', '2024-07-27 07:46:52', '0000-00-00', ''),
(65, '', '', 'Kefyalew', '', 0, 'Message Not Recieved', '2024-07-27 07:48:13', '0000-00-00', 'Your Order Of 3 ጤፍ Has Been Successfully Completed'),
(66, '', '', 'Kefyalew', '', 0, 'Message Not Recieved', '2024-07-27 07:48:19', '0000-00-00', 'Your Order Of 2 ካሮት Has Been Successfully Completed'),
(67, '', '', 'Kefyalew', '', 0, 'Message Not Recieved', '2024-07-27 07:48:21', '0000-00-00', 'Your Order Of 11 ድንች Has Been Successfully Completed'),
(68, '', '102', 'Kefyalew', '', 0, 'Message Not Recieved', '2024-08-24 17:34:52', '2024-08-24', ''),
(69, '', '104', 'Kefyalew', '', 0, 'Message Not Recieved', '2024-08-24 17:36:02', '2024-08-24', ''),
(70, '', '103', 'Kefyalew', '', 0, 'Message Not Recieved', '2024-08-24 17:36:18', '2024-08-24', ''),
(71, '', '105', 'Kefyalew', '', 0, 'Message Not Recieved', '2024-08-24 17:36:48', '2024-08-24', ''),
(72, '', '106', 'Kefyalew', '', 0, 'Message Not Recieved', '2024-08-24 17:36:59', '2024-08-24', ''),
(73, '', '107', 'Kefyalew', '', 0, 'Message Not Recieved', '2024-08-24 17:37:08', '2024-08-24', ''),
(74, 'deliveryman1', '102', 'Kefyalew', 'yene2508102', 0, 'Message Received', '2024-08-25 08:09:22', '0000-00-00', ''),
(75, 'deliveryman1', '103', 'Kefyalew', 'yene2508103', 0, 'Message Received', '2024-08-25 08:09:40', '0000-00-00', ''),
(76, '', '', 'Kefyalew', '', 0, 'Message Not Recieved', '2024-08-25 08:11:33', '0000-00-00', 'Your Order Of 2 መኮረኒ Has Been Successfully Completed'),
(77, '', '', 'Kefyalew', '', 0, 'Message Not Recieved', '2024-08-25 08:11:38', '0000-00-00', 'Your Order Of 25 ድንች Has Been Successfully Completed'),
(78, '', '111', 'Meba', '', 0, 'Message Not Recieved', '2024-09-27 16:01:39', '2024-09-27', ''),
(79, '', '112', 'Meba', '', 0, 'Message Not Recieved', '2024-09-27 16:01:58', '2024-09-27', ''),
(80, 'deliveryman1', '111', 'Meba', 'yene2709111', 0, 'Message Received', '2024-09-27 17:57:41', '0000-00-00', ''),
(81, 'deliveryman1', '112', 'Meba', 'yene2709112', 0, 'Message Received', '2024-09-27 17:57:48', '0000-00-00', ''),
(82, '', '', 'Meba', '', 0, 'Message Not Recieved', '2024-09-27 17:58:46', '0000-00-00', 'Your Order Of 2 Avocado  አቭካዶ Has Been Successfully Completed'),
(83, '', '', 'Meba', '', 0, 'Message Not Recieved', '2024-09-27 17:58:51', '0000-00-00', 'Your Order Of 1 Tomato  ቲማቲም Has Been Successfully Completed');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `username` text NOT NULL,
  `address` text NOT NULL,
  `region` text NOT NULL,
  `title` text NOT NULL,
  `image` text NOT NULL,
  `ids` text NOT NULL,
  `quantity` text NOT NULL,
  `payment` text NOT NULL,
  `file_uploaded` text NOT NULL,
  `total_price` text NOT NULL,
  `shipment` text NOT NULL,
  `service_payment` text NOT NULL,
  `total_pay` text NOT NULL,
  `ordered_at` datetime DEFAULT convert_tz(utc_timestamp(),'+00:00','+03:00'),
  `status` text DEFAULT 'pending',
  `price` text NOT NULL,
  `is_read` int(11) DEFAULT 1,
  `liyu_name` text NOT NULL,
  `sub_city` text NOT NULL,
  `national_id` text NOT NULL,
  `deliveryman` text NOT NULL,
  `due_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `username`, `address`, `region`, `title`, `image`, `ids`, `quantity`, `payment`, `file_uploaded`, `total_price`, `shipment`, `service_payment`, `total_pay`, `ordered_at`, `status`, `price`, `is_read`, `liyu_name`, `sub_city`, `national_id`, `deliveryman`, `due_date`) VALUES
(111, 'Meba', 'Adiss abeba', 'Addis Ababa', 'Avocado  አቭካዶ', '6023619765408482292 (1).jpg', '79', '2', 'CBE-1000482255788', 'Screenshot_20240927_141942_yene-suq.jpg', '190', '200', '19', '409', '2024-09-27 15:57:56', 'Order Completed', '60', 1, 'Kotebe', 'Yeka', '', 'deliveryman1', '2024-09-27'),
(112, 'Meba', 'Adiss abeba', 'Addis Ababa', 'Tomato  ቲማቲም', '6023619765408482300.jpg', '75', '1', 'CBE-1000482255788', 'Screenshot_20240927_141942_yene-suq.jpg', '190', '200', '19', '409', '2024-09-27 15:57:56', 'Order Completed', '70', 1, 'Kotebe', 'Yeka', '', 'deliveryman1', '2024-09-27'),
(113, 'Tadese', 'adiss abeba', 'Addis Ababa', 'Tomato  ቲማቲም', '6023619765408482300.jpg', '75', '3', 'CBE-1000482255788', 'Screenshot_20240926_172136_Phone.jpg', '1100', '200', '110', '1410', '2024-09-28 20:32:00', 'Payment Not Verified', '70', 1, 'Kotebe', 'Yeka', 'IMG_20240910_183023.heic', '', '0000-00-00'),
(114, 'Tadese', 'adiss abeba', 'Addis Ababa', 'Carrot  ካሮት', '6023619765408482358.jpg', '77', '1', 'CBE-1000482255788', 'Screenshot_20240926_172136_Phone.jpg', '1100', '200', '110', '1410', '2024-09-28 20:32:00', 'Payment Not Verified', '50', 1, 'Kotebe', 'Yeka', 'IMG_20240910_183023.heic', '', '0000-00-00'),
(115, 'Tadese', 'adiss abeba', 'Addis Ababa', 'Red onion  ቀይ ሽንኩርት', 'benefits-of-onions-1536x1239.jpg', '74', '1', 'CBE-1000482255788', 'Screenshot_20240926_172136_Phone.jpg', '1100', '200', '110', '1410', '2024-09-28 20:32:00', 'Payment Not Verified', '100', 1, 'Kotebe', 'Yeka', 'IMG_20240910_183023.heic', '', '0000-00-00'),
(116, 'Tadese', 'adiss abeba', 'Addis Ababa', 'ነጭ ሽንኩርት', 'th (8).jpeg', '70', '2', 'CBE-1000482255788', 'Screenshot_20240926_172136_Phone.jpg', '1100', '200', '110', '1410', '2024-09-28 20:32:00', 'Payment Not Verified', '290', 1, 'Kotebe', 'Yeka', 'IMG_20240910_183023.heic', '', '0000-00-00'),
(117, 'Tadese', 'adiss abeba', 'Addis Ababa', 'ሀባብ ', 'th (16).jpeg', '72', '2', 'CBE-1000482255788', 'Screenshot_20240926_172136_Phone.jpg', '1100', '200', '110', '1410', '2024-09-28 20:32:00', 'Payment Not Verified', '50', 1, 'Kotebe', 'Yeka', 'IMG_20240910_183023.heic', '', '0000-00-00'),
(118, 'Tadese', 'adiss abeba', 'Addis Ababa', 'Potato  ድንች', 'iC7HBvohbJqExqvbKcV3pP-1200-80.jpg', '76', '2', 'CBE-1000482255788', 'Screenshot_20240926_172136_Phone.jpg', '1100', '200', '110', '1410', '2024-09-28 20:32:00', 'Payment Not Verified', '30', 1, 'Kotebe', 'Yeka', 'IMG_20240910_183023.heic', '', '0000-00-00');

-- --------------------------------------------------------

--
-- Table structure for table `seller`
--

CREATE TABLE `seller` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `lname` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `phone` VARCHAR(20), -- Made optional
  `password` VARCHAR(255) NOT NULL,
  `address` VARCHAR(255), -- Made optional
  `region` VARCHAR(255) NOT NULL,
  `sub_city` VARCHAR(255), -- Made optional
  `woreda` VARCHAR(255) NOT NULL,
  `liyu_name` VARCHAR(255), -- Made optional
  `liyu_sign` VARCHAR(255), -- Made optional
  `home_phone` VARCHAR(20), -- Made optional
  `tin_num` VARCHAR(20), -- Made optional
  `bank_name` VARCHAR(255), -- Made optional
  `account_number` VARCHAR(50), -- Made optional
  `national_id` VARCHAR(50), -- Made optional
  `verification` int(11) DEFAULT 0,
  `image` VARCHAR(255) DEFAULT 'admin1.jpg', -- Optional with default value
  `registered_at` datetime NOT NULL DEFAULT convert_tz(utc_timestamp(),'+00:00','+03:00'),
  `status` VARCHAR(50) DEFAULT 'Unverified', -- Optional with default value
  `commerce1` VARCHAR(255) NOT NULL,
  `commerce2` VARCHAR(255) NOT NULL,
  `tin_doc` VARCHAR(255), -- Made optional
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `seller`
--

INSERT INTO `seller` (`id`, `name`, `lname`, `email`, `phone`, `password`, `address`, `region`, `sub_city`, `woreda`, `liyu_name`, `liyu_sign`, `home_phone`, `tin_num`, `bank_name`, `account_number`, `national_id`, `verification`, `image`, `registered_at`, `status`, `commerce1`, `commerce2`, `tin_doc`) VALUES
(22, 'Eisg', 'Sgwta', 'elam5211@gmail.com', '924888824', 'fetan12', 'Addis', 'Addis Ababa', 'Arada', '02', 'Eta', 'Eyhd', '', '000122679', 'Abyssinia', '33513291', 'FT poster 1-min.jpg', 1, 'admin1.jpg', '2024-06-09 15:05:07', 'Verified', 'IMG-20240603-WA0001.jpg', 'FB_IMG_1710991792531.jpg', ''),
(24, '', 'PWjmNBTK9fQdc', 'eman@yenesuq.com', '913401122', '123', '', 'Addis Abeba', 'Gullele', '25', '', '', 'sjdhg', 'personal', '', '', 'sweater3.webp', 0, 'admin1.jpg', '2024-06-18 14:32:15', 'Unverified', 'Skoda New Kodiaq104.jpg', 'Maruti Fronx101.webp', 'Volkswagen Taigun101.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` text NOT NULL,
  `email` text NOT NULL,
  `phone` text NOT NULL,
  `password` text NOT NULL,
  `lastsignin` timestamp NULL DEFAULT convert_tz(utc_timestamp(),'+00:00','+03:00'),
  `status` text DEFAULT 'Inactive'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `lastsignin`, `status`) VALUES
(12, 'mom', 'mom@gmail.com', '0941246063', '7890', '2024-03-20 20:25:50', 'Inactive'),
(14, 'sol', 'sol@gmail.com', '+251941246063', '7890', '2024-03-20 20:31:31', 'Inactive'),
(15, 'aman', 'aman@gmail.com', '251941246063', '7890', '2024-03-20 20:32:32', 'Inactive'),
(17, 'Kasahun', 'kasahunmeba@gmail.com', '908912323', '123456', '2024-04-01 15:19:37', 'Inactive'),
(18, 'Kasahun', 'kasahunmeba@gmail.com', '908912323', '123456', '2024-04-01 15:20:16', 'Inactive');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `addproduct`
--
ALTER TABLE `addproduct`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ads`
--
ALTER TABLE `ads`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cart`
--
ALTER TABLE `cart`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `customers_info`
--
ALTER TABLE `customers_info`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `delivery`
--
ALTER TABLE `delivery`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `liked`
--
ALTER TABLE `liked`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `seller`
--
ALTER TABLE `seller`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `addproduct`
--
ALTER TABLE `addproduct`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=85;

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `ads`
--
ALTER TABLE `ads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `cart`
--
ALTER TABLE `cart`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=661;

--
-- AUTO_INCREMENT for table `customers_info`
--
ALTER TABLE `customers_info`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT for table `delivery`
--
ALTER TABLE `delivery`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `liked`
--
ALTER TABLE `liked`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `notification`
--
ALTER TABLE `notification`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=84;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=119;

--
-- AUTO_INCREMENT for table `seller`
--
ALTER TABLE `seller`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
