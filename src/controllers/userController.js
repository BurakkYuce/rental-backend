// src/controllers/userController.js - User management APIs for admin
const { validationResult } = require("express-validator");

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users for admin management
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive]
 *         description: Filter by user status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in user name or email
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized - Admin access required
 */
const getAdminUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    // Mock users data matching Admin.jsx structure
    let allUsers = [
      {
        id: 1,
        name: "John Smith",
        email: "john@example.com",
        phone: "+1 234 567 8900",
        joinDate: "2024-01-15",
        status: "Active",
        totalBookings: 5,
        address: "123 Main St, New York, NY",
      },
      {
        id: 2,
        name: "Sarah Johnson",
        email: "sarah@example.com",
        phone: "+1 234 567 8901",
        joinDate: "2024-02-20",
        status: "Active",
        totalBookings: 3,
        address: "456 Oak Ave, Los Angeles, CA",
      },
      {
        id: 3,
        name: "Mike Davis",
        email: "mike@example.com",
        phone: "+1 234 567 8902",
        joinDate: "2024-03-10",
        status: "Inactive",
        totalBookings: 1,
        address: "789 Pine St, Chicago, IL",
      },
      {
        id: 4,
        name: "Emily Wilson",
        email: "emily@example.com",
        phone: "+1 234 567 8903",
        joinDate: "2024-04-05",
        status: "Active",
        totalBookings: 7,
        address: "321 Elm St, Houston, TX",
      },
      {
        id: 5,
        name: "Robert Brown",
        email: "robert@example.com",
        phone: "+1 234 567 8904",
        joinDate: "2024-05-12",
        status: "Active",
        totalBookings: 2,
        address: "654 Maple Ave, Phoenix, AZ",
      },
    ];

    // Apply filters
    if (status) {
      allUsers = allUsers.filter((user) => user.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      allUsers = allUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedUsers = allUsers.slice(startIndex, endIndex);

    const totalPages = Math.ceil(allUsers.length / limitNum);

    res.status(200).json({
      success: true,
      data: {
        users: paginatedUsers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages,
          totalUsers: allUsers.length,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error in getAdminUsers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

module.exports = {
  getAdminUsers,
};