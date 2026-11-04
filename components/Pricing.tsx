import styles from "./Pricing.module.css";

const PLANS = [
  {
    name: "Hỏi nhanh",
    price: "40.000đ",
    unit: "1 câu hỏi",
    features: ["Một câu hỏi cụ thể", "Rút một lá bài để trả lời", "Diễn ra qua Google Meet"],
    featured: false,
  },
  {
    name: "Xem trọn giờ",
    price: "100.000đ",
    unit: "1 giờ",
    features: ["Thời lượng 1 giờ", "Trải bài và phân tích chi tiết", "Hỏi đáp nhiều câu trong buổi", "Diễn ra qua Google Meet"],
    featured: true,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="mb-5" style={{ scrollMarginTop: 80 }}>
      <h2 className="h4 tarot-title fw-bold text-center mb-4">Bảng giá</h2>
      <div className="row g-4 justify-content-center">
        {PLANS.map((plan) => (
          <div className="col-12 col-md-6" key={plan.name}>
            <div className={`tarot-card ${styles.card} ${plan.featured ? styles.featured : ""}`}>
              {plan.featured && <span className={styles.badge}>Phổ biến</span>}
              <h3 className={styles.name}>{plan.name}</h3>
              <p className={styles.price}>{plan.price}</p>
              <p className={styles.unit}>/ {plan.unit}</p>
              <ul className={styles.features}>
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
      <p className={styles.note}>Giá có thể thay đổi. Vui lòng xác nhận khi đặt lịch.</p>
    </section>
  );
}
