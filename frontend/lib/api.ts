import axios from "axios";

// Get API URL from environment variable (set in production via Vercel/Railway)
// Falls back to localhost for local development
const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // Fallback for local development
  if (typeof window !== "undefined") {
    return window.location.origin.replace(":3000", ":8000");
  }
  return "http://localhost:8000";
};

export const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface Survey {
  id: number;
  title: string;
  is_active: boolean;
  created_at: string;
  questions: Question[];
}

export interface Question {
  id: number;
  survey_id: number;
  question_text: string;
  order: number;
}

export interface SubmissionStart {
  submission_id: number;
  survey_id: number;
  message: string;
}

export interface AnswerSubmit {
  question_id: number;
  answer: "Yes" | "No";
  face_detected: boolean;
  face_score: number | null;
}

// Survey APIs
export const surveyApi = {
  list: async (): Promise<Survey[]> => {
    const response = await api.get("/api/surveys");
    return response.data;
  },

  create: async (title: string): Promise<Survey> => {
    const response = await api.post("/api/surveys", { title });
    return response.data;
  },

  addQuestion: async (
    surveyId: number,
    questionText: string,
    order: number
  ): Promise<Question> => {
    const response = await api.post(`/api/surveys/${surveyId}/questions`, {
      question_text: questionText,
      order,
    });
    return response.data;
  },

  get: async (surveyId: number): Promise<Survey> => {
    const response = await api.get(`/api/surveys/${surveyId}`);
    return response.data;
  },

  publish: async (
    surveyId: number,
    isActive: boolean = true
  ): Promise<Survey> => {
    const response = await api.post(`/api/surveys/${surveyId}/publish`, {
      is_active: isActive,
    });
    return response.data;
  },

  delete: async (surveyId: number) => {
    const response = await api.delete(`/api/surveys/${surveyId}`);
    return response.data;
  },
};

// Submission APIs
export const submissionApi = {
  start: async (surveyId: number): Promise<SubmissionStart> => {
    const response = await api.post(`/api/surveys/${surveyId}/start`);
    return response.data;
  },

  submitAnswer: async (submissionId: number, answer: AnswerSubmit) => {
    const response = await api.post(
      `/api/submissions/${submissionId}/answers`,
      answer
    );
    return response.data;
  },

  uploadMedia: async (
    submissionId: number,
    file: File,
    type: "video" | "image",
    questionNumber?: number
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    if (questionNumber) {
      formData.append("question_number", questionNumber.toString());
    }
    const response = await api.post(
      `/api/submissions/${submissionId}/media`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  complete: async (submissionId: number, overallScore: number | null) => {
    const response = await api.post(
      `/api/submissions/${submissionId}/complete`,
      {
        overall_score: overallScore,
      }
    );
    return response.data;
  },

  export: async (submissionId: number): Promise<Blob> => {
    const response = await api.get(`/api/submissions/${submissionId}/export`, {
      responseType: "blob",
    });
    return response.data;
  },

  get: async (submissionId: number) => {
    const response = await api.get(`/api/submissions/${submissionId}`);
    return response.data;
  },

  getBySurvey: async (surveyId: number) => {
    const response = await api.get(`/api/surveys/${surveyId}/submissions`);
    return response.data;
  },

  delete: async (submissionId: number) => {
    const response = await api.delete(`/api/submissions/${submissionId}`);
    return response.data;
  },
};

export default api;
