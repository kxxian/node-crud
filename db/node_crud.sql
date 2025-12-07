-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               11.8.3-MariaDB-0+deb13u1 from Debian - -- Please help get to 10k stars at https://github.com/MariaDB/Server
-- Server OS:                    debian-linux-gnu
-- HeidiSQL Version:             12.12.1.208
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping data for table node_crud.posts: ~12 rows (approximately)
DELETE FROM `posts`;
INSERT INTO `posts` (`id`, `title`, `body`, `image`) VALUES
	(1, 'Matrix', 'Everything that has a beginning, has an end', '1764678047764-matrix.jpg'),
	(19, 'JavaScript', 'JavaScript (JS) is a high-level, dynamic, and multi-paradigm programming language that conforms to the ECMAScript standard.', '1765046626445-js.png'),
	(20, 'NodeJS', 'A free, open-source, cross-platform JavaScript runtime environment that lets developers create servers, web apps, command line tools and scripts.', '1765046743402-nodejs.png'),
	(21, 'ReactJS', 'Is an open-source JavaScript library developed and maintained by Meta (formerly Facebook) and a community of individual developers and companies. Its primary purpose is to facilitate the building of user interfaces (UIs) for web and native platforms.', '1765046877875-react.png'),
	(22, 'PHP', 'PHP, which stands for "PHP: Hypertext Preprocessor" (a recursive acronym), is a widely-used, open-source, server-side scripting language primarily designed for web development. It can be embedded directly into HTML. ', '1765046937889-php.png'),
	(23, 'HTML', 'HTML, or Hypertext Markup Language, is the standard language for creating web pages, used to structure content and describe how it should be displayed to users. ', '1765095279156-html.png'),
	(24, 'CSS', 'CSS, which stands for Cascading Style Sheets, is a stylesheet language used to describe the presentation and styling of a document written in a markup language, most commonly HTML.', '1765095361978-css.png'),
	(25, 'Laravel', 'A popular, free, open-source PHP web framework that provides elegant syntax and powerful tools to build modern, scalable web applications with a focus on developer experience.', '1765095396325-laravel.jpeg'),
	(26, 'Ruby', 'Ruby is a dynamic, open-source programming language known for its focus on simplicity and productivity.', NULL),
	(27, 'Go', '', NULL),
	(28, 'C++', '', NULL),
	(29, 'Java', 'A popular, multi-platform, object-oriented programming language developed by James Gosling at Sun Microsystems and now owned by Oracle.', NULL);

-- Dumping data for table node_crud.post_attachments: ~12 rows (approximately)
DELETE FROM `post_attachments`;
INSERT INTO `post_attachments` (`id`, `post_id`, `filename`, `original_name`, `file_size`, `created_at`) VALUES
	(9, 1, '1765045643782-514mo7-attachment1.docx', 'attachment1.docx', 5111, '2025-12-06 18:27:23'),
	(10, 19, '1765046626446-kjaism-attachment1.docx', 'attachment1.docx', 5111, '2025-12-06 18:43:46'),
	(11, 19, '1765046626446-eni7h-attachment2.docx', 'attachment2.docx', 5111, '2025-12-06 18:43:46'),
	(12, 21, '1765046877875-cz9ha-attachment5.docx', 'attachment5.docx', 5112, '2025-12-06 18:47:57'),
	(13, 21, '1765046877875-9jv31y-attachment1.docx', 'attachment1.docx', 5111, '2025-12-06 18:47:57'),
	(14, 21, '1765046877876-qpaek-attachment2.docx', 'attachment2.docx', 5111, '2025-12-06 18:47:57'),
	(15, 21, '1765046877876-izekd-attachment3.docx', 'attachment3.docx', 5112, '2025-12-06 18:47:57'),
	(16, 21, '1765046877876-qoxf1t-attachment4.docx', 'attachment4.docx', 5112, '2025-12-06 18:47:57'),
	(17, 23, '1765095279159-ib1ztl-attachment1.docx', 'attachment1.docx', 5111, '2025-12-07 08:14:39'),
	(18, 23, '1765095279159-2wacz-attachment2.docx', 'attachment2.docx', 5111, '2025-12-07 08:14:39'),
	(19, 23, '1765095279160-n4i9q-attachment3.docx', 'attachment3.docx', 5112, '2025-12-07 08:14:39'),
	(20, 25, '1765095396326-77rkzc-attachment2.docx', 'attachment2.docx', 5111, '2025-12-07 08:16:36');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
