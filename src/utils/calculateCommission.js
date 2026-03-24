/**
 * Calculates commission based on monthly salary.
 * Commission is 8% of the yearly salary.
 * @param {number} monthlySalary 
 * @returns {object} { yearlySalary, commission }
 */
const calculateCommission = (monthlySalary) => {
    const yearlySalary = monthlySalary * 12;
    const commission = yearlySalary * 0.08;
    return {
        yearlySalary,
        commission
    };
};

module.exports = calculateCommission;
