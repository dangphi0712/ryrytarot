import InstagramIcon from "@mui/icons-material/Instagram";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import styles from "./Footer.module.css";

const INSTAGRAM_URL = "https://www.instagram.com/ryry_tarot?psln=Z3N3ZGJ6ZmtodWdi";
const PHONE_DISPLAY = "0789 487 205";
const PHONE_LINK = "+84789487205";
const EMAIL = "nguyenthao8422@gmail.com";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div>
            <p className={styles.brand}>
              <span className={styles.star} aria-hidden="true">✦</span>
              ryrytarot
            </p>
            <p className={styles.tagline}>
              Lắng nghe lá bài, tìm lời đáp cho hôm nay. Buổi xem diễn ra trực tuyến qua Google Meet.
            </p>
          </div>

          <div>
            <h3 className={styles.heading}>Liên hệ</h3>
            <ul className={styles.list}>
              <li>
                <a href={`tel:${PHONE_LINK}`} className={styles.link}>
                  <span className={styles.iconWrap}>
                    <PhoneIcon fontSize="small" />
                  </span>
                  {PHONE_DISPLAY}
                </a>
              </li>
              <li>
                <a href={`mailto:${EMAIL}`} className={styles.link}>
                  <span className={styles.iconWrap}>
                    <EmailIcon fontSize="small" />
                  </span>
                  {EMAIL}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={styles.heading}>Theo dõi</h3>
            <ul className={styles.list}>
              <li>
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className={`${styles.link} ${styles.igLink}`}>
                  <span className={styles.iconWrap}>
                    <InstagramIcon fontSize="small" />
                  </span>
                  Instagram @ryry_tarot
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className={styles.bottom}>© {new Date().getFullYear()} ryrytarot</p>
      </div>
    </footer>
  );
}
