module.exports = (action) => async (req, res, next) => {
    try {
      await AuditLog.create({
        action,
        userId: req.user?.id,
        komikId: req.params.id,
        data: JSON.stringify(req.body)
      });
      next();
    } catch (err) {
      console.error('Audit log error:', err);
      next();
    }
  };