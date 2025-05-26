import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Specialty.css';
import Footer from '../Footer/Footer';
import axiosInstance from '../../util/axios';
import BookingModal from "../Doctor/BookingModal"; // modal đặt lịch

const timeTypeMap = {
  T1: '08:00 - 09:00',
  T2: '09:00 - 10:00',
  T3: '10:00 - 11:00',
  T4: '13:00 - 14:00',
  T5: '14:00 - 15:00',
  T6: '15:00 - 16:00',
  T7: '16:00 - 17:00',
};

const Specialty = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [detail, setDetail] = useState({});
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState({});
  const [selectedDates, setSelectedDates] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Lấy chuyên khoa và bác sĩ
  useEffect(() => {
    const fetchSpecialtyAndDoctors = async () => {
      try {
        const res = await axiosInstance.get('http://localhost:8083/api/get-detail-specialty-by-id', {
          params: { id, location: 'ALL' },
        });
        if (res.data.errCode === 0) {
          setDetail(res.data.data || {});
          const doctorIds = res.data.data.doctorSpecialty?.map(item => item.doctorId) || [];
          const doctorPromises = doctorIds.map(doctorId =>
            axiosInstance.get('http://localhost:8083/api/get-detail-doctor-by-id', {
              params: { id: doctorId },
            })
          );
          const responses = await Promise.all(doctorPromises);
          const validDoctors = responses
            .filter(r => r.data.errCode === 0)
            .map(r => r.data.data);
          setDoctors(validDoctors);

          const today = new Date().toISOString().split('T')[0];
          const initialDates = {};
          validDoctors.forEach(d => {
            initialDates[d.id] = today;
          });
          setSelectedDates(initialDates);
        }
      } catch (error) {
        console.error('Lỗi khi lấy chuyên khoa hoặc bác sĩ:', error);
        setDetail({});
        setDoctors([]);
      }
    };

    if (id) fetchSpecialtyAndDoctors();
  }, [id]);

  // Lấy lịch khám
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!doctors.length) return;

      try {
        const schedulePromises = doctors.map(doc => {
          const date = selectedDates[doc.id];
          if (!date) return Promise.resolve({ data: { errCode: 1 } });
          return axiosInstance.get('http://localhost:8083/api/get-schedule-doctor-by-date', {
            params: { doctorId: doc.id, date },
          });
        });

        const responses = await Promise.all(schedulePromises);
        const scheduleMap = {};
        responses.forEach((res, idx) => {
          const doctorId = doctors[idx].id;
          scheduleMap[doctorId] = res.data.errCode === 0 ? res.data.data || [] : [];
        });

        setSchedules(scheduleMap);
      } catch (error) {
        console.error('Lỗi khi lấy lịch khám:', error);
        setSchedules({});
      }
    };

    fetchSchedules();
  }, [doctors, selectedDates]);

  const renderSchedule = (doctorId) => {
    const doctorSchedules = schedules[doctorId] || [];

    if (doctorSchedules.length === 0) {
      return <p>{t('Chưa có lịch khám cho ngày này.')}</p>;
    }

    return (
      <div className="time-slot-grid">
        {doctorSchedules.map((slot) => {
          const label = timeTypeMap[slot.timeType] || slot.timeType;
          const isAvailable = slot.status === 'available' || slot.status === 1;

          return (
            <button
              key={slot.id || slot.timeType}
              className={`time-slot ${isAvailable ? 'available' : 'full'}`}
              disabled={!isAvailable}
              onClick={() => {
                if (isAvailable) {
                  const doctor = doctors.find(d => d.id === doctorId);
                  setSelectedDoctor(doctor);
                  setSelectedSlot(slot);
                  setIsModalOpen(true);
                  setBookingSuccess(false);
                }
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  };

  const handleBookingSuccess = () => {
    setIsModalOpen(false);
    setBookingSuccess(true);
    setTimeout(() => setBookingSuccess(false), 3000);
  };

  return (
    <div className="specialty-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo" onClick={() => navigate('/')}>
          <img className="logo-img" src="/logo.png" alt="BookingCare" />
          <span className="logo-text">BookingCare</span>
        </div>
        <ul className="nav-links">
          <li>{t('Chuyên khoa')}<br /><span>{t('Tìm bác sĩ theo chuyên khoa')}</span></li>
          <li>{t('Cơ sở y tế')}<br /><span>{t('Chọn bệnh viện phòng khám')}</span></li>
          <li>{t('Bác sĩ')}<br /><span>{t('Chọn bác sĩ giỏi')}</span></li>
          <li>{t('Gói khám')}<br /><span>{t('Khám sức khỏe tổng quát')}</span></li>
        </ul>
        <div className="navbar-right">
          <button><i className="fa-solid fa-phone-volume"></i> {t('Hỗ trợ')}</button>
          <div className="language-switch">
            <button className="active-lang">🇻🇳</button>
            <button>🇺🇸</button>
          </div>
        </div>
      </nav>

      {/* Thông tin chuyên khoa */}
      <div className="specialty-detail-box">
        <h2 className="title">{detail.name || t('Tên chuyên khoa')}</h2>
        <p className="sub-title">{t(`Chuyên khoa ${detail.name || 'chuyên khoa'}`)}</p>
        {detail.descriptionHTML && (
          <div
            className="description-html"
            dangerouslySetInnerHTML={{ __html: detail.descriptionHTML }}
          />
        )}
      </div>

      {/* Danh sách bác sĩ */}
      {doctors.length > 0 ? (
        doctors.map((doctor) => {
          const selectedDate = selectedDates[doctor.id] || new Date().toISOString().split('T')[0];
          return (
            <div key={doctor.id} className="doctor-card">
              <div className="doctor-header">
                <img
                  src={`http://localhost:8083${doctor.image}`}
                  alt={`${doctor.lastName} ${doctor.firstName} `}
                  className="doctor-image"
                />
                <div className="doctor-info">
                  <h2>
                      <span className="favorite-icon">❤️ Yêu thích</span>{' '}
                      {doctor.positionData?.valueVi} {doctor.lastName} {doctor.firstName}
                  </h2>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: doctor.Markdown?.description || `<p>${t('Chưa có giới thiệu')}</p>`,
                    }}
                  />
                  <div className="doctor-location" style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                    {doctor.provinceId ? `Vị trí: ${provinceMap[doctor.provinceId] || doctor.provinceId}` : 'Chưa cập nhật vị trí'}
                  </div>



                </div>
              </div>

              {/* Lịch khám */}
              <div className="doctor-schedule" style={{ width: '40%' }}>
                <h4>{t('Lịch khám')}:</h4>
                <div>
                  <label htmlFor={`date-${doctor.id}`}>{t('Chọn ngày')}: </label>
                  <input
                    id={`date-${doctor.id}`}
                    type="date"
                    value={selectedDate}
                    onChange={(e) =>
                      setSelectedDates((prev) => ({ ...prev, [doctor.id]: e.target.value }))
                    }
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                {renderSchedule(doctor.id)}
                <div className="note">{t('Chọn giờ và đặt (miễn phí)')}</div>

                {/* Thông tin phòng khám */}
                <div className="clinic-info-horizontal">
                  <div><strong>{t('Phòng khám')}:</strong> {doctor.Doctor_Infor?.nameClinic || t('Chưa cập nhật')}</div>
                  <div><strong>{t('Địa chỉ')}:</strong> {doctor.Doctor_Infor?.addressClinic || t('Chưa cập nhật')}</div>
                  <div><strong>{t('Giá khám')}:</strong> {doctor.Doctor_Infor?.priceId || t('Chưa cập nhật')} VND</div>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <p>{t('Đang tải thông tin bác sĩ...')}</p>
      )}

      {/* Modal đặt lịch */}
      {isModalOpen && selectedDoctor && selectedSlot && (
        <BookingModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleBookingSuccess}
          doctorId={selectedDoctor.id}
          date={selectedDates[selectedDoctor.id]}
          timeType={selectedSlot.timeType}
          doctorInfo={selectedDoctor}
        />
      )}

      {/* Thông báo thành công */}
      {bookingSuccess && (
        <div className="booking-success-popup">
          <p>{t("Bạn đã đặt lịch thành công - Vui lòng xác nhận email!")}</p>
          <button onClick={() => setBookingSuccess(false)}>OK</button>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Specialty;
