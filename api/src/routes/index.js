@@ .. @@
 const authRoutes = require('./authRoutes');
 const adminRoutes = require('./adminRoutes');
 const contactRoutes = require('./contactRoutes');
 const newsletterRoutes = require('./newsletterRoutes');
 const blogRoutes = require('./blogRoutes');
+const appointmentRoutes = require('./appointmentRoutes');
 
 const router = express.Router();
 
@@ .. @@
 router.use('/contact', contactRoutes);
 router.use('/newsletter', newsletterRoutes);
 router.use('/blog', blogRoutes);
+router.use('/appointments', appointmentRoutes);
 
 module.exports = router;