import prisma from '../config/database.js';

class DoctorService {
  async getDoctors(query) {
    const { specialization } = query;
    
    const filters = {};
    if (specialization) {
      filters.specializations = {
        has: specialization
      };
    }

    const doctors = await prisma.doctorProfile.findMany({
      where: filters,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    return doctors;
  }
}

export default new DoctorService();
