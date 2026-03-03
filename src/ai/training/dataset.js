/*
Label mapping:
0 = HocTap
1 = CaNhan
2 = CongViec
*/

const trainingData = [
  { text: "Hoàn thành bài tập AI", label: 0 },
  { text: "Làm báo cáo môn học", label: 0 },
  { text: "Ôn thi cuối kỳ", label: 0 },
  { text: "Đi mua đồ ăn", label: 1 },
  { text: "Tập thể dục buổi sáng", label: 1 },
  { text: "Đi chơi với bạn", label: 1 },
  { text: "Họp với khách hàng", label: 2 },
  { text: "Gửi email cho sếp", label: 2 },
  { text: "Chuẩn bị tài liệu dự án", label: 2 },
  { text: "Nộp bài tập trước hạn", label: 0 },
  { text: "Đi du lịch cùng gia đình", label: 1 },
  { text: "Thực hiện cuộc gọi với đối tác", label: 2 }
];

// generate 100 additional synthetic entries for expanded training set
for (let i = 0; i < 100; i++) {
  const label = i % 3; // cycle through 0,1,2
  trainingData.push({
    text: `Mẫu câu tự động số ${i + 1}`,
    label,
  });
}

module.exports = { trainingData };
