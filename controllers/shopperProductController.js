const ShopperProduct = require('../models/shopperProduct.js');
const Shopper = require('../models/Shopper.js');
const sequelize = require('../db/dbConnect.js');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs/promises');

/**
 * =================================================================================
 * API USAGE GUIDE (IMPORTANT FOR FRONTEND)
 * =================================================================================
 * This controller expects 'multipart/form-data'. An authentication token (JWT)
 * providing `req.user.id` is required for all create, update, delete, and
 * shop-specific "get" operations.
 *
 * --- For Creating/Updating Products ---
 * * FIELDS: title, price, description, brand, etc.
 * * JSON STRINGS: `variations`, `color_options` must be JSON strings.
 * * IMAGES: All image files are sent under the field name 'images'.
 * =================================================================================
 */

// --- FILE HANDLING & STORAGE SETUP ---
const storage = multer.memoryStorage();
const upload = multer({
	storage,
	limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
	fileFilter: (req, file, cb) => {
		const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
		cb(null, allowedTypes.includes(file.mimetype));
	},
}).array('images', 20);

// --- CORE CRUD FUNCTIONS (CREATE, UPDATE, DELETE) ---

const createProduct = async (req, res) => {
	try {
		const {
			title,
			price,
			description,
			brand,
			catItems,
			subcat,
			productfor,
			stock,
			variations: variationsJSON,
			color_options: colorOptionsJSON,
			general_image_count,
			location_name,
			coordinates: coordinatesJSON,
			location_radius,
		} = req.body;

		// Process uploaded images (returns an array of paths/URLs)
		const allNewImagePaths = await processUploadedImages(req.files);

		// Parse general images
		const generalImageCount = parseInt(general_image_count, 10) || 0;
		const generalImages = allNewImagePaths.slice(0, generalImageCount);

		// Handle color options
		let color_options_data = colorOptionsJSON
			? JSON.parse(colorOptionsJSON)
			: [];

		let currentIndex = generalImageCount;
		color_options_data.forEach((option) => {
			const imageCountForColor = option.image_count || 0;
			option.images = allNewImagePaths.slice(
				currentIndex,
				currentIndex + imageCountForColor
			);
			currentIndex += imageCountForColor;
			delete option.image_count;
		});

		// Handle variations with images
		let variations = variationsJSON ? JSON.parse(variationsJSON) : [];
		variations.forEach((variation) => {
			const imageCountForVariation = variation.image_count || 0;
			variation.images = allNewImagePaths.slice(
				currentIndex,
				currentIndex + imageCountForVariation
			);
			currentIndex += imageCountForVariation;
			delete variation.image_count;
		});

		// Handle coordinates
		let geoData = coordinatesJSON ? JSON.parse(coordinatesJSON) : null;
		if (geoData && geoData.lat && geoData.lng) {
			geoData = {
				type: 'Point',
				coordinates: [geoData.lng, geoData.lat],
			};
		}

		// Create product
		const product = await ShopperProduct.create({
			shopper_id: req.user.id,
			title,
			price,
			description,
			brand,
			catItems,
			subcat,
			productfor,
			stock,
			status: 'pending',
			image: generalImages,
			color_options: color_options_data,
			variations,
			location_name,
			coordinates: geoData,
			location_radius,
		});

		res.status(201).json(product);
	} catch (error) {
		console.error('Error creating product:', error);
		res.status(500).json({
			message: 'Failed to create product',
			error: error.message,
		});
	}
};

const updateProduct = async (req, res) => {
	try {
		const { id } = req.params;
		const {
			existingImages: existingImagesJSON,
			variations: variationsJSON,
			color_options: colorOptionsJSON,
			coordinates: coordinatesJSON,
			general_image_count,
			location_prices,
			location_stock,
			...updateData
		} = req.body;

		const product = await ShopperProduct.findByPk(id);
		if (!product) {
			return res.status(404).json({ message: 'Product not found' });
		}

		if (req.user && product.shopper_id !== req.user.id) {
			return res.status(403).json({
				message: "You don't have permission to update this product",
			});
		}

		const allNewImagePaths = await processUploadedImages(req.files);

		let finalGeneralImages = [];

		if (existingImagesJSON) {
			try {
				const existingImages = JSON.parse(existingImagesJSON);
				if (Array.isArray(existingImages)) {
					finalGeneralImages = [...existingImages];
				}
			} catch (err) {
				console.error('Error parsing existing images:', err);
			}
		}

		const generalImageCount = parseInt(general_image_count, 10) || 0;
		const newGeneralImages = allNewImagePaths.slice(0, generalImageCount);
		finalGeneralImages = [...finalGeneralImages, ...newGeneralImages];

		let colorOptions = [];
		let colorImageCounts = [];
		if (colorOptionsJSON) {
			try {
				colorOptions =
					typeof colorOptionsJSON === 'string'
						? JSON.parse(colorOptionsJSON)
						: colorOptionsJSON;

				colorImageCounts = colorOptions.map(
					(option) => option.update_image_count || 0
				);

				let currentIndex = generalImageCount;
				colorOptions.forEach((option, index) => {
					const newImageCount = colorImageCounts[index];
					if (newImageCount > 0) {
						const newImages = allNewImagePaths.slice(
							currentIndex,
							currentIndex + newImageCount
						);
						option.images = [
							...(option.images || []),
							...newImages,
						];
						currentIndex += newImageCount;
					}
					delete option.update_image_count;
				});
			} catch (err) {
				console.error('Error parsing color options:', err);
				colorOptions = [];
			}
		}

		let variations = [];
		if (variationsJSON) {
			try {
				variations =
					typeof variationsJSON === 'string'
						? JSON.parse(variationsJSON)
						: variationsJSON;

				const variationImageCounts = variations.map(
					(variation) => variation.update_image_count || 0
				);

				let currentIndex = generalImageCount;

				const totalColorImages = colorImageCounts.reduce(
					(sum, count) => sum + count,
					0
				);
				currentIndex += totalColorImages;

				variations.forEach((variation, index) => {
					const newImageCount = variationImageCounts[index];
					if (newImageCount > 0) {
						const newImages = allNewImagePaths.slice(
							currentIndex,
							currentIndex + newImageCount
						);
						variation.images = [
							...(variation.images || []),
							...newImages,
						];
						currentIndex += newImageCount;
					}
					delete variation.update_image_count;
				});
			} catch (err) {
				console.error('Error parsing variations:', err);
				variations = [];
			}
		}

		let geoData;
		if (coordinatesJSON && coordinatesJSON !== 'null') {
			try {
				const parsed = JSON.parse(coordinatesJSON);
				if (parsed?.lat && parsed?.lng) {
					geoData = {
						type: 'Point',
						coordinates: [parsed.lng, parsed.lat],
					};
				}
			} catch (err) {
				console.error('Error parsing coordinates:', err);
			}
		}

		let locationPricesData, locationStockData;

		if (location_prices) {
			try {
				locationPricesData =
					typeof location_prices === 'string'
						? JSON.parse(location_prices)
						: location_prices;
			} catch (err) {
				console.error('Error parsing location_prices:', err);
			}
		}

		if (location_stock) {
			try {
				locationStockData =
					typeof location_stock === 'string'
						? JSON.parse(location_stock)
						: location_stock;
			} catch (err) {
				console.error('Error parsing location_stock:', err);
			}
		}

		const updateFields = {
			...updateData,
			image: finalGeneralImages,
			color_options: colorOptions,
			variations,
		};

		if (geoData) updateFields.coordinates = geoData;
		if (locationPricesData)
			updateFields.location_prices = locationPricesData;
		if (locationStockData) updateFields.location_stock = locationStockData;

		await product.update(updateFields);

		try {
			const oldImages = product.image || [];
			const imagesToDelete = oldImages.filter(
				(img) => !finalGeneralImages.includes(img)
			);
			for (const img of imagesToDelete) {
				await deleteFile(img);
			}
		} catch (err) {
			console.error('Error deleting old images:', err);
		}

		const updatedProduct = await ShopperProduct.findByPk(id);
		return res.status(200).json(updatedProduct);
	} catch (error) {
		console.error('Error updating product:', error);
		return res.status(500).json({
			message: 'Failed to update product',
			error: error.message,
		});
	}
};

const uploadFile = async (file) => {
	const fileName = `${Date.now()}-${Math.random()
		.toString(36)
		.substring(7)}.${file.name.split('.').pop()}`;
	const path = `/uploads/${fileName}`;
	await file.mv(`./public${path}`);
	return path;
};

const deleteFile = async (filePath) => {
	const fullPath = `./public${filePath}`;
	await fs.unlink(fullPath);
};

const deleteProduct = async (req, res) => {
	if (!req.user || !req.user.id) {
		return res.status(401).json({ message: 'Authentication required.' });
	}
	try {
		const { id } = req.params;
		const product = await ShopperProduct.findByPk(id);
		if (!product) {
			return res.status(404).json({ message: 'Product not found.' });
		}

		if (product.shopper_id !== req.user.id) {
			return res.status(403).json({
				message:
					'Forbidden. You do not have permission to delete this product.',
			});
		}

		// --- FIX STARTS HERE ---

		// 1. Safely parse color_options if it's a string, otherwise use it as is.
		const colorOptions =
			typeof product.color_options === 'string'
				? JSON.parse(product.color_options)
				: product.color_options;

		// 2. Build the list of images to delete using the parsed array.
		const imagesToDelete = [
			...(product.image || []),
			// Ensure colorOptions is an array before calling flatMap
			...(Array.isArray(colorOptions)
				? colorOptions.flatMap((option) => option.images || [])
				: []),
		];

		// --- FIX ENDS HERE ---

		if (imagesToDelete.length > 0) {
			await deleteUploadedImages(imagesToDelete);
		}

		await product.destroy();
		res.status(200).json({ message: 'Product deleted successfully!' });
	} catch (error) {
		console.error('Error deleting product:', error);
		res.status(500).json({ message: 'Failed to delete product.' });
	}
};

// --- PUBLIC "READ" FUNCTIONS ---

const shuffleArray = (array) => {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
};

const getAllProducts = async (req, res) => {
	try {
		const { subcat, mode } = req.query;
		const where = { status: 'approved' };
		if (subcat) where.subcat = subcat;
		if (mode) where.productfor = mode;

		const products = await ShopperProduct.findAll({ where });
		res.status(200).json(shuffleArray(products));
	} catch (error) {
		console.error('Error fetching products:', error);
		res.status(500).json({ message: 'Failed to fetch products.' });
	}
};

const getAllPendingProducts = async (req, res) => {
	try {
		const { subcat, mode } = req.query;
		const where = { status: 'pending' };
		if (subcat) where.subcat = subcat;
		if (mode) where.productfor = mode;

		const products = await ShopperProduct.findAll({ where });
		res.status(200).json(products);
	} catch (error) {
		console.error('Error fetching pending products:', error);
		res.status(500).json({ message: 'Failed to fetch pending products' });
	}
};
const getApprovedProductDetail = async (req, res) => {
	try {
		const { id } = req.params;

		const product = await ShopperProduct.findOne({
			where: { id, status: 'approved' },
		});

		if (!product) {
			return res
				.status(404)
				.json({ message: 'Approved product not found' });
		}

		res.status(200).json(product);
	} catch (error) {
		console.error('Error fetching approved product detail:', error);
		res.status(500).json({
			message: 'Failed to fetch approved product detail',
		});
	}
};

const getAllApprovedProducts = async (req, res) => {
	try {
		const { subcat, mode } = req.query;

		// Base condition: only approved products
		const where = { status: 'approved' };

		// Optional filters
		if (subcat) where.subcat = subcat;
		if (mode) where.productfor = mode;

		const products = await ShopperProduct.findAll({ where });

		res.status(200).json(products);
	} catch (error) {
		console.error('Error fetching approved products:', error);
		res.status(500).json({ message: 'Failed to fetch approved products' });
	}
};

const getProductById = async (req, res) => {
	try {
		const { id } = req.params;
		const product = await ShopperProduct.findByPk(id, {
			include: {
				model: Shopper,
				as: 'seller',
				attributes: ['id', 'full_name'],
			},
		});
		if (!product) {
			return res.status(404).json({ message: 'Product not found.' });
		}
		res.status(200).json(product);
	} catch (error) {
		console.error('Error fetching product by ID:', error);
		res.status(500).json({ message: 'Failed to fetch product by ID.' });
	}
};

const getProductsByLocation = async (req, res) => {
	try {
		const { lat, lng, radius = 50 } = req.query;
		if (!lat || !lng) {
			return res
				.status(400)
				.json({ message: 'Latitude and longitude are required' });
		}

		const products = await sequelize.query(
			`
      SELECT * FROM shopper_products
      WHERE status = 'approved' AND ST_DWithin(
        coordinates,
        ST_MakePoint(?, ?)::geography,
        ?
      )
    `,
			{
				replacements: [lng, lat, radius * 1000],
				type: sequelize.QueryTypes.SELECT,
				model: ShopperProduct,
				mapToModel: true,
			}
		);

		res.status(200).json(products);
	} catch (error) {
		console.error('Location search error:', error);
		res.status(500).json({ message: 'Failed to search by location' });
	}
};

// --- SHOPPER-SPECIFIC "READ" FUNCTIONS ---

const getMyShopApprovedProducts = async (req, res) => {
	try {
		const products = await ShopperProduct.findAll({
			where: {
				shopper_id: req.user.id,
				status: 'approved',
			},
			order: [['updated_at', 'DESC']],
		});
		res.status(200).json(products);
	} catch (error) {
		console.error('Error fetching approved products for shopper:', error);
		res.status(500).json({
			message: 'Failed to fetch your approved products.',
			error: error.message,
		});
	}
};

const getMyShopPendingProducts = async (req, res) => {
	try {
		const products = await ShopperProduct.findAll({
			where: {
				shopper_id: req.user.id,
				status: 'pending',
			},
			order: [['created_at', 'DESC']],
		});
		res.status(200).json(products);
	} catch (error) {
		console.error('Error fetching pending products for shopper:', error);
		res.status(500).json({
			message: 'Failed to fetch your pending products.',
			error: error.message,
		});
	}
};

// --- HELPER FUNCTIONS ---

async function processUploadedImages(files) {
	if (!files || files.length === 0) return [];
	const imageUploadPromises = files.map((file) => {
		const filename = `${Date.now()}-${Math.random()
			.toString(36)
			.substring(2, 8)}.webp`;
		const filepath = path.join(__dirname, '../uploads', filename);
		return sharp(file.buffer)
			.resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
			.webp({ quality: 85 })
			.toFile(filepath)
			.then(() => `/uploads/${filename}`);
	});
	return Promise.all(imageUploadPromises);
}

async function deleteUploadedImages(imagePaths) {
	if (!imagePaths || imagePaths.length === 0) return;
	const deletePromises = imagePaths.map((imagePath) => {
		if (!imagePath) return Promise.resolve();
		const fullPath = path.join(__dirname, '..', imagePath);
		return fs
			.unlink(fullPath)
			.catch((err) =>
				console.error(`Failed to delete image: ${fullPath}`, err)
			);
	});
	await Promise.all(deletePromises);
}
const getAllMyProducts = async (req, res) => {
	if (!req.user || !req.user.id) {
		return res.status(401).json({ message: 'Authentication required.' });
	}

	try {
		const products = await ShopperProduct.findAll({
			where: {
				shopper_id: req.user.id,
			},
			order: [['updated_at', 'DESC']],
		});

		res.status(200).json(products);
	} catch (error) {
		console.error('Error fetching all products for shopper:', error);
		res.status(500).json({
			message: 'Failed to fetch your products.',
			error: error.message,
		});
	}
};
const getMyShopProductById = async (req, res) => {
	try {
		if (!req.user || !req.user.id) {
			return res
				.status(401)
				.json({ message: 'Authentication required.' });
		}
		const { id } = req.params;

		console.log('Decoded user in request:', req.user);

		// Find the product by ID and ensure it belongs to the authenticated user
		const product = await ShopperProduct.findOne({
			where: {
				id,
				shopper_id: req.user.id,
			},
			include: {
				model: Shopper,
				as: 'shopper',
				attributes: ['id', 'full_name'],
			},
		});

		if (!product) {
			return res
				.status(404)
				.json({ message: 'Product not found or access denied.' });
		}

		res.status(200).json(product);
	} catch (error) {
		console.error(
			'Error fetching product by ID for current shopper:',
			error
		);
		res.status(500).json({
			message: 'Failed to fetch product.',
			error: error.message,
		});
	}
};

const getAllProductDetailById = async (req, res) => {
	try {
		const { id } = req.params;
		console.log('Decoded user in request:', req.user);

		// Find the product by ID and ensure it belongs to the authenticated user
		const product = await ShopperProduct.findOne({
			where: {
				id,
				shopper_id: req.user.id,
			},
		});

		if (!product) {
			return res
				.status(404)
				.json({ message: 'Approved product not found' });
		}

		res.status(200).json(product);
	} catch (error) {
		console.error('Error fetching approved product detail:', error);
		res.status(500).json({
			message: 'Failed to fetch approved product detail',
		});
	}
};

module.exports = { upload, createProduct, updateProduct, deleteProduct, getAllProducts, getAllPendingProducts, getApprovedProductDetail, getAllApprovedProducts, getProductById, getProductsByLocation, getMyShopApprovedProducts, getMyShopPendingProducts, getAllMyProducts, getMyShopProductById, getAllProductDetailById };
