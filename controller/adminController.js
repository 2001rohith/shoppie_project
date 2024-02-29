const User = require("../models/userModel")
const Order = require("../models/orderModel")
const Coupon = require("../models/couponModel")
const Wallet = require("../models/walletModel")
const Return = require("../models/returnModel")
const Transaction = require("../models/walletTransactionModel")
const CategoryOffer = require("../models/categoryOfferModel")
const pdfMake = require('pdfmake/build/pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');
pdfMake.vfs = pdfFonts.pdfMake.vfs; const fs = require('fs');
const XLSX = require('xlsx');
const Product = require("../models/productModel")
const asyncHandler = require("express-async-handler")
const { generateToken } = require("../config/jwtToken")
const generateRefreshToken = require("../config/refreshtoken");
const jwt = require("jsonwebtoken")
const { generateCouponCode } = require("../services/couponCodeGenerator")
const { log } = require("console")

const adminLoginLoad = async (req, res) => {
    try {
        res.render("adminLogin")
    } catch (error) {
        console.log(error.message)
    }
}
const loginAdminCtrl = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    console.log("Login request body:", req.body);
    //console.log(email,password);
    const findUser = await User.findOne({ email })

    if (findUser && await findUser.isPasswordMatched(password)) {
        const userRole = findUser.role;
        //const refreshToken = await generateRefreshToken(findUser?._id)
        const refreshToken = generateRefreshToken(findUser?._id);

        const updateuser = await User.findByIdAndUpdate(findUser.id, {
            refreshToken: refreshToken,
        }, { new: true })
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: 72 * 60 * 60 * 1000
        })
        if (userRole == "admin") {
            res.redirect("/admin/adminHome")
        } else {
            res.render("adminLogin", { message: "not a admin" })
        }
    } else {
        res.render("adminLogin", { message: "invalid details" })
    }
})

const loadAdminHome = async (req, res) => {
    try {
        //const user = await User.findById({_id:req.session.user_id})
        res.render('adminHome')
    } catch (error) {
        console.log(error.message)
    }
}

const handleRefreshToken = asyncHandler(async (req, res) => {
    const cookie = req.cookies
    //console.log(cookie); 
    if (!cookie?.refreshToken) throw new Error("no refresh token in cookie")
    const refreshToken = cookie.refreshToken
    //console.log(refreshToken);
    const user = await User.findOne({ refreshToken })
    if (!user) throw new Error("no refresh token in db")
    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err || user.id !== decoded.id) {
            throw new Error("something wrong withrefresh token")
        }
        const accessToken = generateToken(user?._id)
        res.json({ accessToken })
    })
})

const updateUserLoad = asyncHandler(async (req, res) => {
    try {
        res.render("UpdateUser")
    } catch (error) {
        console.log(error.message)
    }
})
const updatedUser = asyncHandler(async (req, res) => {//update user

    const { id } = req.params
    try {
        const updatedUser = await User.findByIdAndUpdate({ _id: id }, {
            $set: {
                name: req.body.name,
                email: req.body.email,
                mobile: req.body.mobile
            }
        }, {
            new: true
        })
        res.render("adminUpdateUser", { message: "user updated" })
        //res.redirect("/api/admin/all-users")
    } catch (error) {
        throw new Error(error)
    }
})

const getallUser = asyncHandler(async (req, res) => {
    try {
        const searchQuery = req.query.search || "";
        const roleFilter = { role: "user" };
        const searchFilter = {};
        if (searchQuery) {
            searchFilter.$or = [
                { name: { $regex: searchQuery, $options: "i" } }, //case insensitive
                { email: { $regex: searchQuery, $options: "i" } },
            ];
        }
        const userData = await User.find({ $and: [roleFilter, searchFilter] });

        res.render("adminViewUsers", { users: userData, searchQuery });
    } catch (error) {
        throw new Error(error);
    }
});

const loadCreateUser = async (req, res) => {
    try {
        res.render("adminCreateUser")
    } catch (error) {
        console.log(error.message);
    }
}
const createUser = asyncHandler(async (req, res) => {//create user
    const email = req.body.email
    const findUser = await User.findOne({ email: email })//already exist or not
    if (!findUser) {

        const newUser = await User.create(req.body)//new user
        res.redirect("/admin/all-users")

    } else {

        throw new Error("user already exists")

    }

})

const deleteaUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        await User.findByIdAndDelete(id);
        res.redirect("/admin/all-users");
    } catch (error) {
        throw new Error(error);
    }
});

const blockUser = asyncHandler(async (req, res) => {//block user
    const { id } = req.params
    try {
        const block = await User.findByIdAndUpdate(id, { isBlocked: true }, { new: true })
        res.redirect("/admin/all-users");
    } catch (error) {
        throw new Error(error)
    }
})

const unblockUser = asyncHandler(async (req, res) => {//unblock user
    const { id } = req.params
    try {
        const unblock = await User.findByIdAndUpdate(id, { isBlocked: false }, { new: true })
        res.redirect("/admin/all-users");
    } catch (error) {
        throw new Error(error)
    }
})

const logout = asyncHandler(async (req, res) => {//logout
    const cookie = req.cookies
    if (!cookie?.refreshToken) throw new Error("no refresh token")
    const refreshToken = cookie.refreshToken
    const user = await User.findOne({ refreshToken })
    if (!user) {
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: true
        })
        return res.sendStatus(204)//forbdn
    }
    await User.findOneAndUpdate({ refreshToken }, {
        refreshToken: "",
    })
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
    })

    res.redirect("/admin/login")
})

const listOrders = asyncHandler(async (req, res) => {
    try {
        const orders = await Order.find().populate('user').populate('products.product');
        res.render('adminViewOrder', { orders });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Internal Server Error' });
    }
})

const viewOrder = asyncHandler(async (req, res) => {
    const orderId = req.params.orderId;

    try {
        const order = await Order.findById(orderId).populate('products.product').populate('paymentMethod');;

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const userId = order.user;
        console.log("user id :", userId);
        const user = await User.findById(userId).populate('address');

        res.render('adminViewSingleOrder', { order, user });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});





const updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const order = await Order.findByIdAndUpdate(id, { $set: { status } }, { new: true })
            .populate('user', 'isReferred orders');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (status === 'delivered' && order.user && order.user.isReferred) {
            const user = order.user;

            if (user.orders.length > 0) {
                const referralBonusAmount = 50;
                const wallet = await Wallet.findOne({ user: user._id });

                if (wallet) {
                    wallet.balance += referralBonusAmount;
                    await wallet.save();

                    user.isReferred = false;
                    await user.save();
                }
            }
        }

        res.redirect('/admin/get-orders');
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});



const loadCreateCoupon = asyncHandler(async (req, res) => {
    res.render("adminCreateCoupon")
})

const createCoupon = asyncHandler(async (req, res) => {
    try {
        const { discountPercentage, expirationDate, minimumPurchase, maxdiscount } = req.body;
        const couponCode = generateCouponCode();

        const coupon = await Coupon.create({
            code: couponCode,
            discountPercentage,
            expirationDate,
            minimumPurchase,
            maxdiscount,
            usedBy: [],
          });
          

        res.redirect('/admin/coupons');
    } catch (error) {
        console.error(error);
        res.render('adminCreateCoupon', { message: 'Coupon creation failed. Please try again.' });
    }
});

const viewCoupons = asyncHandler(async (req, res) => {
    try {
        const coupons = await Coupon.find();
        res.render('adminViewCoupons', { coupons });
    } catch (error) {
        console.error(error);
        res.render('adminViewCoupons', { message: 'Failed to fetch coupons. Please try again.' });
    }
});
const viewReturns = asyncHandler(async (req, res) => {
    try {
        const returns = await Return.find().populate('user order product').sort({ createdAt: -1 });
        res.render('adminViewReturns', { returns });
    } catch (error) {
        console.error(error);
        res.render('adminViewReturns', { message: 'unable to get returns' });
    }
});


const deleteCoupon = async (req, res) => {
    const { id } = req.params
    console.log("coupon id :", id);
    try {
        await Coupon.findByIdAndDelete(id);
        res.redirect('/admin/coupons');
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const viewReturn = asyncHandler(async (req, res) => {
    const { returnId } = req.params;

    try {
        const returnItem = await Return.findById(returnId).populate('user order product');

        if (!returnItem) {
            res.render('somethingWentwrong');
        }

        res.render('adminViewSingleReturn', { returnItem });
    } catch (error) {
        console.error(error);
        res.render('somethingWentwrong');
    }
});

const rejectReturn = asyncHandler(async (req, res) => {
    try {
        const returnItem = await Return.findById(req.params.returnId)
            .populate('order')
            .exec();

        if (!returnItem) {
            return res.status(404).json({ success: false, message: 'Return not found' });
        }

        returnItem.status = 'Return Rejected';
        await returnItem.save();

        if (returnItem.order) {
            returnItem.order.status = 'Return Rejected';
            await returnItem.order.save();
        }

        res.redirect('/admin/get-returns');
    } catch (error) {
        console.error(error);
        res.render('SomethingWentwrong');
    }
});

const processReturn = asyncHandler(async (req, res) => {
    try {
        const userId = req.body.userId;
        const user = await User.findById(userId);
        const returnId = req.params.returnId;

        const returnRequest = await Return.findById(returnId);

        if (!returnRequest) {
            return res.status(404).json({ error: 'Return request not found' });
        }

        returnRequest.status = 'Accepted';
        await returnRequest.save();

        const order = await Order.findById(returnRequest.order).populate('products.product');
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const returnedProduct = order.products.find(product => product.product._id.toString() === returnRequest.product.toString());

        if (!returnedProduct) {
            return res.status(404).json({ error: 'Returned product not found in the order' });
        }

        if (!returnedProduct.isDamaged) {
            // Update the quantity only if the returned product is not damaged
            const productDoc = await Product.findById(returnedProduct.product);
            if (productDoc) {
                productDoc.quantity += returnedProduct.quantity;
                await productDoc.save();
            }
        }

        returnedProduct.Istatus = 'Accepted Return'; // Update the individual status
        await order.save(); // Save the updated order

        const refundAmount = returnedProduct.price || 0;

        const wallet = await Wallet.findOne({ user: userId });
        if (wallet) {
            wallet.balance += refundAmount;
            await wallet.save();
        } else {
            const newWallet = new Wallet({
                user: userId,
                balance: refundAmount,
            });
            await newWallet.save();
            user.wallet = newWallet._id;
            await user.save({ validateBeforeSave: false });
        }

        const creditTransaction = new Transaction({
            user: userId,
            amount: refundAmount,
            type: 'credit',
        });
        await creditTransaction.save();

        res.redirect("/admin/get-returns");
    } catch (error) {
        console.error('Error processing return:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


/*const processReturn = asyncHandler(async (req, res) => {
    try {
        const userId = req.body.userId
        const user = await User.findById(userId)
        const returnId = req.params.returnId;

        const returnRequest = await Return.findById(returnId);

        if (!returnRequest) {
            return res.status(404).json({ error: 'Return request not found' });
        }

        returnRequest.status = 'Accepted';
        await returnRequest.save();

        const order = await Order.findById(returnRequest.order).populate('products.product');
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (!order.isDamaged) {
            await Promise.all(order.products.map(async (product) => {
                try {
                    const productDoc = await Product.findById(product.product);
                    if (productDoc) {
                        productDoc.quantity += product.quantity;
                        await productDoc.save();
                    }
                } catch (productError) {
                    console.error('Error updating product quantity:', productError);
                }
            }));
        }


        order.status = 'Accepted, Amount refunded to wallet';
        await order.save();

        const refundAmounts = await Promise.all(order.products.map(async (product) => {
            try {
                const productDoc = await Product.findById(product.product);
                return productDoc ? (productDoc.price || 0) : 0;
            } catch (productError) {
                console.error('Error fetching product:', productError);
                return 0;
            }
        }));

        const refundAmount = refundAmounts.reduce((total, amount) => total + amount, 0);

        //const userWallet = await Wallet.findOne({ user: userId });
        //const walletBalance = userWallet ? userWallet.balance : 0;
        const wallet = await Wallet.findOne({ user: userId });
        console.log("wallet in purchase:", wallet)
        if (wallet) {
            wallet.balance += refundAmount;
            console.log("refund amount in wallet purchase:", refundAmount);
            console.log("wallet balance:", wallet.balance);
            await wallet.save();
        } else {
            const newWallet = new Wallet({
                user: userId,
                balance: refundAmount,
            });
            await newWallet.save();
            user.wallet = newWallet._id;
            await user.save({ validateBeforeSave: false });

        }

        const creditTransaction = new Transaction({
            user: userId,
            amount: refundAmount,
            type: 'credit',
        });
        await creditTransaction.save();

        res.redirect("/api/admin/get-returns");
    } catch (error) {
        console.error('Error processing return:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
*/

/*const getOrderStatistics = asyncHandler(async (req, res) => {
    try {
        const orderStatistics = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m', date: '$createdAt' },
                    },
                    orderCount: { $sum: 1 },
                    totalSales: { $sum: '$totalAmount' },
                },
            },
            {
                $sort: { _id: 1 },
            },
        ]);
        console.log(orderStatistics);
        res.render('adminDashboard', { orderStatistics });
    } catch (error) {
        console.error('Error fetching order statistics:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
*/
const getdashboard = asyncHandler(async (req, res) => {
    try {
        const orders = await Order.find();
        const returns = await Return.find()
        const cancelledOrders = await Order.find({ status: 'Cancelled' });
        const deliveredOrders = await Order.find({ status: 'delivered' });
        const codOrders = await Order.find({ paymentMethod: 'COD' })
        const walletOrders = await Order.find({ paymentMethod: 'Wallet' })
        const onlineOrders = await Order.find({ paymentMethod: 'Online' })


        const totalOrders = orders.length;
        const totalReturns = returns.length
        const totalCancelledOrders = cancelledOrders.length
        const totalDeliveredOrders = deliveredOrders.length
        const totalcodOrders = codOrders.length;
        const totalwalletOrders = walletOrders.length;
        const totalOnlineOrders = onlineOrders.length;

        const { totalUsers } = await getUsersData();
        console.log("total user :",totalUsers);

        const latestOrder = await Order.find().sort({ createdAt: -1 }).limit(1);
        console.log('latest order:', latestOrder);
        const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);

        res.render('adminDashboard', { totalOrders, totalAmount, totalReturns, latestOrder, totalCancelledOrders, totalDeliveredOrders, totalcodOrders, totalwalletOrders, totalOnlineOrders ,totalUsers });
    } catch (error) {
        console.error(error);
        res.render('SomethingWentwrong');
    }
});

const getSaleReport = asyncHandler(async (req, res) => {
    try {
        res.render("adminDownloadReport")
    } catch (error) {
        console.error(error);
        res.render('SomethingWentwrong');
    }
})

const getOrderData = async (req, res) => {
    try {
        const orders = await Order.find();

        const monthlyData = orders.reduce((acc, order) => {
            const orderDate = order.createdAt;
            const monthYear = `${orderDate.getMonth() + 1}-${orderDate.getFullYear()}`;

            if (!acc[monthYear]) {
                acc[monthYear] = [];
            }

            acc[monthYear].push(order);
            return acc;
        }, {});


        const yearlyData = orders.reduce((acc, order) => {
            const orderDate = order.createdAt;
            const year = orderDate.getFullYear();

            if (!acc[year]) {
                acc[year] = [];
            }

            acc[year].push(order);
            return acc;

        }, {})

        console.log("monthly data:", monthlyData);
        console.log("yearly data:", yearlyData);
        res.json({ success: true, monthlyData, yearlyData });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const generateSalesReport = async (req, res) => {
    try {
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(req.query.endDate);

        startDate.setUTCHours(0, 0, 0, 0);
        endDate.setUTCHours(23, 59, 59, 999);

        console.log("start date:", startDate);
        console.log("end date:", endDate);

        const salesData = await Order.find({
            createdAt: {
                $gte: startDate,
                $lt: endDate
            }
        }).populate('user').lean();

        console.log("sales data:", salesData);


        const pdfDefinition = {
            content: [
                { text: 'SHOPPIE-E', style: 'header' },
                { text: 'Sales Report', style: 'subheader' },
                { text: `From: ${startDate.toLocaleDateString()} To: ${endDate.toLocaleDateString()}`, style: 'date' },
                { text: `Report Generated at: ${new Date().toLocaleString()}`, style: 'date' },
                { text: '\n' },
                {
                    table: {
                        headerRows: 1,
                        body: [
                            ['User', 'Amount', 'Status', 'Products', 'Date'],
                            ...salesData.map(order => {
                                return [
                                    (order.user && order.user.name) || 'N/A',
                                    order.totalAmount || 'N/A',
                                    order.status || 'N/A',
                                    order.products?.map(product => product.title).join(', ') || 'N/A',
                                    order.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                ];
                            }),
                        ],
                    },
                },
                { text: '\n' },
                { text: `Total Orders: ${salesData.length}`, style: 'totalOrders' },
                { text: `Total Amount: ₹${calculateTotalAmount(salesData)}`, style: 'totalAmount' },

            ],
            styles: {
                header: {
                    fontSize: 18,
                    bold: true,
                    alignment: 'center',
                    margin: [0, 20, 0, 20],
                },
                subheader: {
                    margin: 5,
                    fontSize: 14,
                    bold: true,
                },
                date: {
                    fontSize: 10,
                    bold: true,
                },
                totalAmount: {
                    fontSize: 16,
                    bold: true,
                    color: 'green',
                    alignment: 'right'
                },
                totalOrders: {
                    fontSize: 16,
                    bold: true,
                    color: 'blue',
                    alignment: 'right'

                },
            },
        };

        function calculateTotalAmount(salesData) {
            return salesData.reduce((total, order) => total + (order.totalAmount || 0), 0).toFixed(2);
        }

        console.log("pdf content :", pdfDefinition);
        const pdfBuffer = await new Promise((resolve, reject) => {
            pdfMake.createPdf(pdfDefinition).getBuffer((buffer) => {
                if (buffer) {
                    resolve(buffer);
                } else {
                    reject(new Error('Error generating PDF buffer'));
                }
            });
        });

        const pdfFileName = 'SalesReport.pdf';
        fs.writeFileSync(pdfFileName, pdfBuffer);

        res.download(pdfFileName, "SalesReport.pdf", (err) => {
            if (err) {
                console.error("error sending pdf:", err);
            } else {
                fs.unlinkSync(pdfFileName);
            }
        });
    } catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const generateAndPreviewSalesReport = async (req, res) => {
    try {
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(req.query.endDate);

        startDate.setUTCHours(0, 0, 0, 0);
        endDate.setUTCHours(23, 59, 59, 999);

        const salesData = await Order.find({
            createdAt: {
                $gte: startDate,
                $lt: endDate
            }
        }).populate('user').lean();

        const pdfDefinition = {
            content: [
                { text: 'SHOPPIE-E', style: 'header' },
                { text: 'Sales Report', style: 'subheader' },
                { text: `From: ${startDate.toLocaleDateString()} To: ${endDate.toLocaleDateString()}`, style: 'date' },
                { text: `Report Generated at: ${new Date().toLocaleString()}`, style: 'date' },
                { text: '\n' },
                {
                    table: {
                        headerRows: 1,
                        body: [
                            ['User', 'Amount', 'Status', 'Products', 'Date'],
                            ...salesData.map(order => {
                                return [
                                    (order.user && order.user.name) || 'N/A',
                                    order.totalAmount || 'N/A',
                                    order.status || 'N/A',
                                    order.products?.map(product => product.title).join(', ') || 'N/A',
                                    order.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                ];
                            }),
                        ],
                    },
                },
                { text: '\n' },
                { text: `Total Orders: ${salesData.length}`, style: 'totalOrders' },
                { text: `Total Amount: ₹${calculateTotalAmount(salesData)}`, style: 'totalAmount' },

            ],
            styles: {
                header: {
                    fontSize: 18,
                    bold: true,
                    alignment: 'center',
                    margin: [0, 20, 0, 20],
                },
                subheader: {
                    margin: 5,
                    fontSize: 14,
                    bold: true,
                },
                date: {
                    fontSize: 10,
                    bold: true,
                },
                totalAmount: {
                    fontSize: 16,
                    bold: true,
                    color: 'green',
                    alignment: 'right'
                },
                totalOrders: {
                    fontSize: 16,
                    bold: true,
                    color: 'blue',
                    alignment: 'right'

                },
            },
        };

        function calculateTotalAmount(salesData) {
            return salesData.reduce((total, order) => total + (order.totalAmount || 0), 0).toFixed(2);
        }

        const pdfBuffer = await new Promise((resolve, reject) => {
            pdfMake.createPdf(pdfDefinition).getBuffer((buffer) => {
                if (buffer) {
                    resolve(buffer);
                } else {
                    reject(new Error('Error generating PDF buffer'));
                }
            });
        });

        const pdfContent = pdfBuffer.toString('base64');
        res.json({ pdfContent });
    } catch (error) {
        console.error('Error generating and previewing sales report:', error);
        res.json({ error: 'Internal Server Error' });
    }
};

const getUsersData = async () => {
    try {
        const totalUsers = await User.countDocuments();


        return { totalUsers };
    } catch (error) {
        console.error(error);
        return { totalUsers: 0 }; 
    }
};



const getAllCategoryOffers = async (req, res) => {
    try {
        const categoryOffers = await CategoryOffer.find().populate('category').lean();


        res.render("adminViewCategoryOffer", { categoryOffers })
    } catch (error) {
        console.error('Error fetching category offers:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const deleteCategoryOffer = async (req, res) => {
    try {
        const offerId = req.body.offerId;

        const existingOffer = await CategoryOffer.findById(offerId);
        if (!existingOffer) {
            return res.status(404).json({ error: 'Category offer not found' });
        }

        await CategoryOffer.findByIdAndDelete(offerId);

        res.redirect("/product/getoffers")
    } catch (error) {
        console.error('Error deleting category offer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    adminLoginLoad,
    loginAdminCtrl,
    loadAdminHome,
    getallUser,
    loadCreateUser,
    createUser,
    deleteaUser,
    updateUserLoad,
    updatedUser,
    blockUser,
    unblockUser,
    handleRefreshToken, listOrders, updateOrderStatus, loadCreateCoupon, createCoupon, viewCoupons, viewReturns, viewReturn,
    rejectReturn, processReturn, getOrderData, getdashboard, getSaleReport, generateSalesReport, getAllCategoryOffers, deleteCategoryOffer,
    deleteCoupon, viewOrder,generateAndPreviewSalesReport,
    logout
}