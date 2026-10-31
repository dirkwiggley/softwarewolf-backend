import { Router } from 'express';
import { 
  getSystemHealth, 
  getActivities, 
  createActivity,
  deleteActivity,
  getWidgetControls,
  getWidgetControls as seedWidgetControls,
  getUsers,
  createUser,
  updateUser,
  deleteUser 
} from '../controllers/system.js';
import { login, logout, getMe } from '../controllers/auth.js';
import { restrictTo } from '../middlewares/auth.js';
// Import the new news controllers
import { 
  getNewsArticles, 
  createNewsArticle, 
  updateNewsArticle,
  deleteNewsArticle // 1. Import the delete controller function
} from '../controllers/news.js';

const router = Router();

// Core Identity Authentication Operations
router.post('/auth/login', login);
router.post('/auth/logout', logout);
router.get('/auth/me', getMe);

// Public / General Developer Routes
router.get('/health', getSystemHealth);
router.get('/activities', getActivities);
router.post('/activities', createActivity);
router.delete('/activities/:id', deleteActivity);
router.get('/widgets', getWidgetControls);
router.get('/widgets/seed', seedWidgetControls);

// News Timeline Routes
router.get('/news-articles', getNewsArticles);
router.post('/news-articles', restrictTo('ADMIN', 'MANAGER'), createNewsArticle);
router.patch('/news-articles/:id', restrictTo('ADMIN', 'MANAGER'), updateNewsArticle);
router.delete('/news-articles/:id', restrictTo('ADMIN', 'MANAGER'), deleteNewsArticle); // 2. Guard delete operation

// Secure Administrative User Management Routing Paths
// 1. Intercept preflight OPTIONS calls for user endpoints and respond with a clean 200 OK
router.options('/users/:id', (req, res) => {
  res.sendStatus(200);
});
// 2. Your existing route implementations remain exactly the same
router.patch('/users/:id', restrictTo('ADMIN'), updateUser);
router.delete('/users/:id', restrictTo('ADMIN'), deleteUser);

router.get('/users', restrictTo('ADMIN'), getUsers);
router.post('/users', restrictTo('ADMIN'), createUser);

export default router;
