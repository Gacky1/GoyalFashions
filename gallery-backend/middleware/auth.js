// Simple authentication middleware using environment variables
const auth = (req, res, next) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(401).json({ error: 'Username and password required' });
  }
  
  if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  next();
};

// Middleware to check if user is authenticated (for protected routes)
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
  const [username, password] = credentials;
  
  if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  next();
};

module.exports = { auth, requireAuth };