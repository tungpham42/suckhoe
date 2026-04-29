import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Checkbox,
  Button,
  Card,
  Layout,
  Typography,
  Divider,
  message,
  Row,
  Col,
  Space,
  ConfigProvider,
  theme,
  Switch,
} from "antd";
import {
  UserOutlined,
  HeartOutlined,
  AlertOutlined,
  SendOutlined,
  SunOutlined,
  MoonOutlined,
  MedicineBoxOutlined,
} from "@ant-design/icons";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import dayjs from "dayjs";
import "./App.css";

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Định nghĩa interface cho dữ liệu form
interface HealthRecordData {
  fullName: string;
  gender: string;
  dob: dayjs.Dayjs;
  phone: string;
  heightUnit: "cm" | "ft";
  heightCm?: number;
  heightFt?: number;
  heightIn?: number;
  weight: number;
  weightUnit: "kg" | "lbs";
  bloodType: string;
  allergies: string[];
  otherAllergies?: string; // Trường hứng dữ liệu Dị ứng tự nhập
  chronicDiseases: string[];
  otherChronicDiseases?: string; // Trường hứng dữ liệu Bệnh lý tự nhập
  medications: string;
}

const App: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string | null>(null);

  // Khởi tạo state dựa trên cài đặt mặc định của trình duyệt/hệ thống
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // Lắng nghe sự thay đổi Theme từ hệ thống (Real-time)
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  // Theo dõi giá trị realtime để hiển thị ô nhập liệu "Khác"
  const heightUnit = Form.useWatch("heightUnit", form);
  const allergiesWatch = Form.useWatch("allergies", form) || [];
  const diseasesWatch = Form.useWatch("chronicDiseases", form) || [];

  const hasOtherAllergy = allergiesWatch.includes("Khác");
  const hasOtherDisease = diseasesWatch.includes("Khác");

  const onFinish = async (values: HealthRecordData) => {
    setLoading(true);
    setResult(null);

    // 1. Xử lý các giá trị đơn vị và mảng
    const dobString = values.dob ? values.dob.format("DD/MM/YYYY") : "Không rõ";

    const heightString =
      values.heightUnit === "cm"
        ? `${values.heightCm} cm`
        : `${values.heightFt} ft ${values.heightIn || 0} in`;

    const weightString = `${values.weight} ${values.weightUnit}`;

    // Xử lý chuỗi Dị ứng (Gộp Checkbox và Text Input)
    let finalAllergies = values.allergies
      ? values.allergies.filter((a) => a !== "Khác")
      : [];
    if (hasOtherAllergy && values.otherAllergies) {
      finalAllergies.push(`Khác (${values.otherAllergies})`);
    }
    const allergiesStr =
      finalAllergies.length > 0 ? finalAllergies.join(", ") : "Không có";

    // Xử lý chuỗi Bệnh lý nền (Gộp Checkbox và Text Input)
    let finalDiseases = values.chronicDiseases
      ? values.chronicDiseases.filter((d) => d !== "Khác")
      : [];
    if (hasOtherDisease && values.otherChronicDiseases) {
      finalDiseases.push(`Khác (${values.otherChronicDiseases})`);
    }
    const chronicDiseasesStr =
      finalDiseases.length > 0 ? finalDiseases.join(", ") : "Không có";

    // 2. Tổng hợp dữ liệu thành chuỗi prompt để gửi lên API
    const promptText = `
Dưới đây là thông tin hồ sơ bệnh án cá nhân của tôi. Vui lòng phân tích, tóm tắt và đưa ra lời khuyên sức khỏe tổng quan:

1. THÔNG TIN CÁ NHÂN:
- Họ và tên: ${values.fullName}
- Giới tính: ${values.gender}
- Ngày sinh: ${dobString}
- Số điện thoại: ${values.phone || "Không cung cấp"}

2. THỂ TRẠNG:
- Chiều cao: ${heightString}
- Cân nặng: ${weightString}
- Nhóm máu: ${values.bloodType || "Không rõ"}

3. TIỀN SỬ Y TẾ:
- Dị ứng: ${allergiesStr}
- Bệnh lý nền: ${chronicDiseasesStr}
- Thuốc đang sử dụng: ${values.medications || "Không có"}
    `.trim();

    // 3. Gọi API
    try {
      const response = await axios.post("https://api.soft.io.vn/result", {
        prompt: promptText,
      });

      if (response.data && response.data.result) {
        setResult(response.data.result);
        message.success("Đã phân tích hồ sơ thành công!");
      } else {
        throw new Error("Định dạng API trả về không hợp lệ");
      }
    } catch (error) {
      console.error(error);
      message.error("Có lỗi xảy ra khi gửi dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          colorPrimary: "#0d9488",
          borderRadius: 12,
          colorInfo: "#0d9488",
        },
        components: {
          Card: {
            boxShadowTertiary: isDarkMode
              ? "0 4px 12px rgba(0,0,0,0.4)"
              : "0 10px 20px rgba(0,0,0,0.05)",
          },
        },
      }}
    >
      <AppLayout
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        form={form}
        heightUnit={heightUnit}
        onFinish={onFinish}
        loading={loading}
        result={result}
        hasOtherAllergy={hasOtherAllergy}
        hasOtherDisease={hasOtherDisease}
      />
    </ConfigProvider>
  );
};

// Tách Layout ra một Component con để có thể truy cập được giá trị `token` đúng với Theme hiện tại
const AppLayout = ({
  isDarkMode,
  setIsDarkMode,
  form,
  heightUnit,
  onFinish,
  loading,
  result,
  hasOtherAllergy,
  hasOtherDisease,
}: any) => {
  const { token } = theme.useToken();

  return (
    <Layout
      style={{
        minHeight: "100vh",
        background: token.colorBgLayout,
        transition: "all 0.3s",
      }}
    >
      <Header
        style={{
          background: token.colorBgContainer,
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: isDarkMode
            ? "0 1px 4px rgba(0,0,0,0.3)"
            : "0 2px 8px rgba(0,0,0,0.06)",
          zIndex: 10,
        }}
      >
        <Space align="center" size="middle">
          <div
            style={{
              background: token.colorPrimary,
              color: "#fff",
              borderRadius: "10px",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
            }}
          >
            <MedicineBoxOutlined />
          </div>
          <Title
            level={4}
            style={{
              margin: 0,
              color: token.colorTextHeading,
              fontWeight: 700,
            }}
          >
            Hồ Sơ Sức Khỏe
          </Title>
        </Space>

        <Switch
          checkedChildren={<MoonOutlined />}
          unCheckedChildren={<SunOutlined style={{ color: "#faad14" }} />}
          checked={isDarkMode}
          onChange={(checked) => setIsDarkMode(checked)}
          style={{
            background: isDarkMode ? token.colorTextQuaternary : undefined,
          }}
        />
      </Header>

      <Content
        style={{
          padding: "32px 20px",
          maxWidth: "1100px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} md={24} style={{ transition: "all 0.5s ease" }}>
            <Card
              title={
                <Space>
                  <UserOutlined style={{ color: token.colorPrimary }} />
                  <span>Cập nhật thông tin y tế</span>
                </Space>
              }
              bordered={false}
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{
                  gender: "Nam",
                  heightUnit: "cm",
                  weightUnit: "kg",
                }}
                size="large"
              >
                <Divider style={{ marginTop: 0 }}>
                  <Text type="secondary" strong>
                    <UserOutlined /> Định danh
                  </Text>
                </Divider>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="fullName"
                      label="Họ và tên"
                      rules={[{ required: true, message: "Bắt buộc" }]}
                    >
                      <Input placeholder="Nguyễn Văn A" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="gender" label="Giới tính">
                      <Select
                        options={[
                          { label: "Nam", value: "Nam" },
                          { label: "Nữ", value: "Nữ" },
                          { label: "Khác", value: "Khác" },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="dob"
                      label="Ngày sinh"
                      rules={[{ required: true, message: "Bắt buộc" }]}
                    >
                      <DatePicker
                        style={{ width: "100%" }}
                        format="DD/MM/YYYY"
                        placeholder="Chọn ngày"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="phone" label="Số điện thoại">
                      <Input placeholder="090xxxxxxx" />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider>
                  <Text type="secondary" strong>
                    <HeartOutlined /> Thể trạng
                  </Text>
                </Divider>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label="Chiều cao" style={{ marginBottom: 0 }}>
                      <Space.Compact style={{ width: "100%" }}>
                        {heightUnit === "cm" || !heightUnit ? (
                          <Form.Item
                            name="heightCm"
                            rules={[{ required: true, message: "Nhập số" }]}
                            noStyle
                          >
                            <InputNumber
                              style={{ width: "100%" }}
                              min={50}
                              max={300}
                              placeholder="170"
                            />
                          </Form.Item>
                        ) : (
                          <>
                            <Form.Item
                              name="heightFt"
                              rules={[{ required: true, message: "ft" }]}
                              noStyle
                            >
                              <InputNumber
                                style={{ width: "50%" }}
                                min={1}
                                max={9}
                                placeholder="ft"
                              />
                            </Form.Item>
                            <Form.Item name="heightIn" noStyle>
                              <InputNumber
                                style={{ width: "50%" }}
                                min={0}
                                max={11}
                                placeholder="in"
                              />
                            </Form.Item>
                          </>
                        )}
                        <Form.Item name="heightUnit" noStyle>
                          <Select style={{ width: "90px" }}>
                            <Option value="cm">cm</Option>
                            <Option value="ft">ft/in</Option>
                          </Select>
                        </Form.Item>
                      </Space.Compact>
                    </Form.Item>
                  </Col>

                  <Col span={8}>
                    <Form.Item label="Cân nặng" style={{ marginBottom: 0 }}>
                      <Space.Compact style={{ width: "100%" }}>
                        <Form.Item
                          name="weight"
                          rules={[{ required: true, message: "Nhập số" }]}
                          noStyle
                        >
                          <InputNumber
                            style={{ width: "100%" }}
                            min={2}
                            max={600}
                            placeholder="65"
                          />
                        </Form.Item>
                        <Form.Item name="weightUnit" noStyle>
                          <Select style={{ width: "80px" }}>
                            <Option value="kg">kg</Option>
                            <Option value="lbs">lbs</Option>
                          </Select>
                        </Form.Item>
                      </Space.Compact>
                    </Form.Item>
                  </Col>

                  <Col span={8}>
                    <Form.Item name="bloodType" label="Nhóm máu">
                      <Select
                        allowClear
                        placeholder="Chọn"
                        options={[
                          { label: "A", value: "A" },
                          { label: "B", value: "B" },
                          { label: "AB", value: "AB" },
                          { label: "O", value: "O" },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <div style={{ marginBottom: 24 }} />

                <Divider>
                  <Text type="secondary" strong>
                    <AlertOutlined /> Bệnh sử
                  </Text>
                </Divider>

                {/* --- DANH SÁCH DỊ ỨNG MỞ RỘNG --- */}
                <Form.Item
                  name="allergies"
                  label="Dị ứng (Có thể chọn nhiều)"
                  style={{ marginBottom: hasOtherAllergy ? 8 : 24 }}
                >
                  <Checkbox.Group style={{ width: "100%" }}>
                    <Row gutter={[16, 12]}>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Kháng sinh">
                          Kháng sinh (Penicillin...)
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Thuốc giảm đau">
                          Thuốc giảm đau (NSAIDs, Aspirin)
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Thuốc cản quang">
                          Thuốc cản quang (Contrast dye)
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Thuốc gây tê/mê">
                          Thuốc gây tê / Gây mê
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Hải sản">
                          Hải sản (Tôm, cua, cá)
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Các loại hạt">
                          Đậu phộng / Các loại hạt
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Sữa">
                          Sữa (Bất dung nạp Lactose)
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Trứng">Trứng</Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Đậu nành">Đậu nành</Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Gluten">
                          Lúa mì / Gluten (Celiac)
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Phụ gia thực phẩm">
                          Phụ gia / Bột ngọt (MSG)
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Phấn hoa">Phấn hoa</Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Mạt bụi nhà">Mạt bụi nhà</Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Lông động vật">
                          Lông động vật (Chó, mèo)
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Nấm mốc">Nấm mốc</Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Cao su">Cao su y tế (Latex)</Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Côn trùng">
                          Nọc côn trùng (Ong, kiến)
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Hóa chất">Hóa chất / Mỹ phẩm</Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Kim loại">
                          Kim loại (Niken, Đồng)
                        </Checkbox>
                      </Col>
                      {/* Tùy chọn KHÁC */}
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Khác">
                          Khác (Vui lòng nhập)...
                        </Checkbox>
                      </Col>
                    </Row>
                  </Checkbox.Group>
                </Form.Item>
                {/* Input hiện ra khi chọn Khác */}
                {hasOtherAllergy && (
                  <Form.Item
                    name="otherAllergies"
                    rules={[
                      { required: true, message: "Vui lòng nhập tên dị ứng" },
                    ]}
                  >
                    <Input placeholder="Nhập các dị ứng khác của bạn (cách nhau bằng dấu phẩy)..." />
                  </Form.Item>
                )}

                {/* --- DANH SÁCH BỆNH LÝ NỀN MỞ RỘNG --- */}
                <Form.Item
                  name="chronicDiseases"
                  label="Bệnh lý nền (Có thể chọn nhiều)"
                  style={{ marginBottom: hasOtherDisease ? 8 : 24 }}
                >
                  <Checkbox.Group style={{ width: "100%" }}>
                    <Row gutter={[16, 12]}>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Huyết áp cao">Huyết áp cao</Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Huyết áp thấp">Huyết áp thấp</Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Tim mạch">
                          Bệnh mạch vành / Suy tim
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Rối loạn nhịp tim">
                          Rối loạn nhịp tim
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Tiểu đường">
                          Tiểu đường (Type 1/2)
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Mỡ máu cao">
                          Rối loạn mỡ máu (Cholesterol)
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Béo phì">
                          Béo phì / Hội chứng chuyển hóa
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Tuyến giáp">
                          Bệnh tuyến giáp (Cường/Suy)
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Hen suyễn">Hen suyễn</Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="COPD">
                          Viêm phế quản mạn / COPD
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Ngưng thở khi ngủ">
                          Ngưng thở khi ngủ (Sleep Apnea)
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Bệnh dạ dày">
                          Viêm loét dạ dày / GERD
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="IBS">
                          Hội chứng ruột kích thích (IBS)
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Bệnh gan">
                          Viêm gan (B, C) / Xơ gan
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Bệnh thận">
                          Suy thận / Bệnh thận mạn
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Sỏi thận">
                          Sỏi thận / Tiết niệu
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Viêm khớp">
                          Thoái hóa khớp / Viêm khớp
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Loãng xương">Loãng xương</Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Gout">Bệnh Gout</Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Bệnh tự miễn">
                          Lupus / Bệnh tự miễn khác
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Động kinh">
                          Động kinh / Co giật
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Đau nửa đầu">
                          Đau nửa đầu (Migraine)
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Sa sút trí tuệ">
                          Sa sút trí tuệ (Alzheimer...)
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Parkinson">Parkinson</Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Tâm lý">
                          Trầm cảm / Rối loạn lo âu
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Rối loạn lưỡng cực">
                          Rối loạn lưỡng cực
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Thiếu máu">
                          Thiếu máu / Thalassemia
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Rối loạn đông máu">
                          Rối loạn đông máu
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Ung thư">
                          Ung thư / Khối u ác tính
                        </Checkbox>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Lao phổi">
                          Lao phổi / Lao các cơ quan
                        </Checkbox>
                      </Col>
                      {/* Tùy chọn KHÁC */}
                      <Col xs={24} sm={12} md={8}>
                        <Checkbox value="Khác">
                          Khác (Vui lòng nhập)...
                        </Checkbox>
                      </Col>
                    </Row>
                  </Checkbox.Group>
                </Form.Item>
                {/* Input hiện ra khi chọn Khác */}
                {hasOtherDisease && (
                  <Form.Item
                    name="otherChronicDiseases"
                    rules={[
                      { required: true, message: "Vui lòng nhập tên bệnh lý" },
                    ]}
                  >
                    <Input placeholder="Nhập các bệnh lý khác của bạn (cách nhau bằng dấu phẩy)..." />
                  </Form.Item>
                )}

                <Form.Item
                  name="medications"
                  label="Các loại thuốc đang sử dụng thường xuyên"
                >
                  <TextArea
                    rows={3}
                    placeholder="Ví dụ: Vitamin C 500mg, Panadol, Thuốc huyết áp..."
                  />
                </Form.Item>

                <Form.Item style={{ marginTop: "30px", marginBottom: 0 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    block
                    icon={<SendOutlined />}
                    loading={loading}
                    style={{
                      height: "50px",
                      fontSize: "16px",
                      fontWeight: 600,
                    }}
                  >
                    Phân Tích Hồ Sơ Sức Khỏe
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          {/* Cột Hiển thị kết quả từ API */}
          {result && (
            <Col xs={24} md={24}>
              <Card
                title={
                  <Space>
                    <HeartOutlined style={{ color: "#eb2f96" }} />
                    <span>Đánh Giá Từ Hệ Thống</span>
                  </Space>
                }
                bordered={false}
                style={{ height: "100%" }}
              >
                <div
                  className="markdown-container"
                  style={{
                    padding: "24px",
                    background: token.colorFillAlter, // Nền thay đổi theo Dark/Light mode
                    borderRadius: "12px",
                    minHeight: "400px",
                    border: `1px solid ${token.colorBorderSecondary}`,
                  }}
                >
                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw]}
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ node, ...props }) => (
                        <Title
                          level={2}
                          style={{ color: token.colorPrimary }}
                          {...props}
                        />
                      ),
                      h2: ({ node, ...props }) => (
                        <Title
                          level={3}
                          style={{ color: token.colorPrimary }}
                          {...props}
                        />
                      ),
                      h3: ({ node, ...props }) => (
                        <Title level={4} {...props} />
                      ),
                      p: ({ node, ...props }) => (
                        <Text
                          style={{
                            display: "block",
                            marginBottom: "1.2em",
                            fontSize: "15px",
                            lineHeight: "1.6",
                          }}
                          {...props}
                        />
                      ),
                      li: ({ node, ...props }) => (
                        <li
                          style={{
                            color: token.colorText,
                            marginBottom: "8px",
                            lineHeight: "1.6",
                          }}
                          {...props}
                        />
                      ),
                    }}
                  >
                    {result}
                  </ReactMarkdown>
                </div>
              </Card>
            </Col>
          )}
        </Row>
      </Content>
    </Layout>
  );
};

export default App;
