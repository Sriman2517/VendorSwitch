export const capabilityFeatureOptions = {
  PAN_VERIFICATION: ["PAN_STATUS", "NAME_MATCH", "DOB_MATCH", "LOW_COST"],
  OCR: ["TEXT_EXTRACTION", "IMAGE_QUALITY_CHECK", "DOCUMENT_TYPE_DETECTION", "FIELD_CONFIDENCE"],
  SMS: ["OTP_DELIVERY", "DLT_TEMPLATE", "DELIVERY_REPORT", "UNICODE_SMS"]
};

export const capabilityPayloads = {
  PAN_VERIFICATION: {
    pan: "ABCDE1234F",
    name: "Rahul Sharma"
  },
  OCR: {
    documentType: "AADHAAR",
    imageUrl: "https://example.com/sample-document.jpg"
  },
  SMS: {
    mobile: "9876543210",
    message: "Your OTP is 123456"
  }
};

export const capabilityOptions = Object.keys(capabilityFeatureOptions);
