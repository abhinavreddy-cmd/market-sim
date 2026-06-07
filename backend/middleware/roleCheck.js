export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ 
      success: false, 
      message: 'Forbidden. Admin access required.' 
    });
  }
  next();
};

export const requireStudent = (req, res, next) => {
  if (req.user.role !== 'STUDENT') {
    return res.status(403).json({ 
      success: false, 
      message: 'Forbidden. Student access required.' 
    });
  }
  next();
};
