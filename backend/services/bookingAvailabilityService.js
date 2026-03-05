const { Op } = require('sequelize');
const { Booking } = require('../models');

const HOLD_MINUTES = parseInt(process.env.BOOKING_HOLD_MINUTES || '15', 10);

const getPendingThresholdDate = () => {
  const threshold = new Date();
  threshold.setMinutes(threshold.getMinutes() - HOLD_MINUTES);
  return threshold;
};

const getHoldExpiresAt = (createdAt) => {
  const base = new Date(createdAt);
  base.setMinutes(base.getMinutes() + HOLD_MINUTES);
  return base;
};

const getOverlapCondition = (startDate, endDate) => ({
  [Op.or]: [
    { startDate: { [Op.between]: [startDate, endDate] } },
    { endDate: { [Op.between]: [startDate, endDate] } },
    {
      [Op.and]: [
        { startDate: { [Op.lte]: startDate } },
        { endDate: { [Op.gte]: endDate } }
      ]
    }
  ]
});

const cleanupExpiredPendingBookings = async () => {
  const threshold = getPendingThresholdDate();
  const [count] = await Booking.update(
    {
      status: 'cancelled',
      paymentStatus: 'failed',
      notes: 'Reservation annulee automatiquement (verrou expire).'
    },
    {
      where: {
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: { [Op.lt]: threshold }
      }
    }
  );
  return count;
};

const findBlockingBooking = async ({ vehicleId, startDate, endDate }) => {
  const threshold = getPendingThresholdDate();

  return Booking.findOne({
    where: {
      vehicleId,
      ...getOverlapCondition(startDate, endDate),
      [Op.or]: [
        {
          status: { [Op.in]: ['confirmed', 'in_progress'] }
        },
        {
          status: 'pending',
          paymentStatus: 'pending',
          createdAt: { [Op.gte]: threshold }
        }
      ]
    },
    order: [['createdAt', 'DESC']]
  });
};

const isVehicleDateRangeAvailable = async ({ vehicleId, startDate, endDate }) => {
  await cleanupExpiredPendingBookings();
  const blockingBooking = await findBlockingBooking({ vehicleId, startDate, endDate });
  return {
    available: !blockingBooking,
    blockingBooking
  };
};

module.exports = {
  HOLD_MINUTES,
  getPendingThresholdDate,
  getHoldExpiresAt,
  cleanupExpiredPendingBookings,
  findBlockingBooking,
  isVehicleDateRangeAvailable
};
