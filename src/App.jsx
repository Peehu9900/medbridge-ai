import { useState } from "react";

import Tesseract from "tesseract.js";

import "./App.css";
const medicineSuggestions = {
  Fever: {
    medicine: "Paracetamol (acetaminophen)",
    reason: "Fever reported by the patient",
  },

  Headache: {
    medicine: "Paracetamol (acetaminophen)",
    reason: "Headache reported by the patient",
  },

  "Body Pain": {
    medicine: "Paracetamol (acetaminophen)",
    reason: "Body pain reported by the patient",
  },

  Cough: {
    medicine: "No automatic medicine suggestion",
    reason: "Requires clinical evaluation",
  },

  Vomiting: {
    medicine: "No automatic medicine suggestion",
    reason: "Requires clinical evaluation",
  },

  "Chest Pain": {
    medicine: "No automatic medicine suggestion",
    reason: "Requires clinical evaluation",
  },

  "Difficulty Breathing": {
    medicine: "No automatic medicine suggestion",
    reason: "Requires clinical evaluation",
  },
};

const commonQuestions = [
  "Do you have any known allergies? If yes, please mention them.",
  "Do you have any previous medical history or illnesses? If yes, please mention them.",
  "Are you currently taking any medicines? If yes, please mention them.",
  "Have you previously taken any AYUSH treatment? If yes, please mention it.",
  "Are you currently using any AYUSH medicines or products? If yes, please mention them.",
];

const adaptiveQuestions = {
  "Chest Pain": [
    "When did the chest pain start?",
    "Where exactly do you feel the pain?",
    "How would you describe the pain?",
    "Does the pain move to your arm, shoulder, jaw, back, or elsewhere?",
  ],

  Fever: [
    "When did the fever start?",
    "Have you measured your temperature?",
    "Are you experiencing chills or body aches?",
    "Are you experiencing any body pain?",
    "How would you describe the pain?",
  ],

  Cough: [
    "When did the cough start?",
    "Is the cough dry or are you producing mucus?",
    "Are you experiencing fever?",
    "Are you experiencing difficulty breathing?",
    "Are you experiencing any chest or throat pain?",
    "How would you describe the pain?",
  ],

  Headache: [
    "When did the headache start?",
    "Where do you feel the headache?",
    "How would you describe the pain?",
    "Are you experiencing vomiting, dizziness, or vision changes?",
  ],

  "Body Pain": [
    "When did the pain start?",
    "Where do you feel the pain?",
    "How would you describe the pain?",
    "Is the pain constant or does it come and go?",
  ],

  Vomiting: [
    "When did the vomiting start?",
    "How many times have you vomited?",
    "Are you experiencing stomach pain?",
    "How would you describe the pain?",
  ],
};

function App() {
const [screen, setScreen] = useState("home");

  const [patient, setPatient] = useState({
    name: "",
    age: "",
    gender: "",
    id: "",
  });

  const [complaint, setComplaint] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState("");

const painOptions = [
  { emoji: "🙂", label: "Mild", value: "Mild pain" },
  { emoji: "😐", label: "Moderate", value: "Moderate pain" },
  { emoji: "😣", label: "Severe", value: "Severe pain" },
  { emoji: "😫", label: "Very Severe", value: "Very severe pain" },
  { emoji: "🚨", label: "Extremely Severe", value: "Extremely severe pain" },
];
  const [documents, setDocuments] = useState([]);
  const [transcript, setTranscript] = useState("");
const [summary, setSummary] = useState(null);
const [verified, setVerified] = useState(false);
const [editing, setEditing] = useState(false);
const [rejected, setRejected] = useState(false);
const [redFlag, setRedFlag] = useState(false);
const [medicineApproved, setMedicineApproved] = useState(false);
const [medicineRejected, setMedicineRejected] = useState(false);
const [selectedDocument, setSelectedDocument] = useState(null);
  const symptoms = [
    "Fever",
    "Cough",
    "Headache",
    "Chest Pain",
    "Vomiting",
    "Difficulty Breathing",
    "Body Pain",
    "Other",
  ];

const questions = [
  ...commonQuestions,
  ...(adaptiveQuestions[complaint] || adaptiveQuestions["Fever"]),
];
const isPainSeverityQuestion =
  questions[questionIndex]?.toLowerCase().includes("describe the pain") ||
  questions[questionIndex]?.toLowerCase().includes("how severe is the pain") ||
  questions[questionIndex]?.toLowerCase().includes("how bad is the pain");
  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((previous) =>
      previous.includes(symptom)
        ? previous.filter((item) => item !== symptom)
        : [...previous, symptom]
    );
  };

  const startIntake = () => {
    setScreen("registration");
  };

  const continueRegistration = () => {
    if (!patient.name || !patient.age) {
      alert("Please enter the patient's name and age.");
      return;
    }

    setScreen("symptoms");
  };

  const continueSymptoms = () => {
    if (selectedSymptoms.length === 0) {
      alert("Please select at least one symptom.");
      return;
    }

    const firstComplaint = selectedSymptoms[0];
    setComplaint(firstComplaint);
    setScreen("questions");

    if (
      selectedSymptoms.includes("Chest Pain") ||
      selectedSymptoms.includes("Difficulty Breathing")
    ) {
      setRedFlag(true);
    }
  };

  const submitAnswer = () => {
    if (!currentAnswer.trim()) {
      alert("Please provide an answer.");
      return;
    }

    setAnswers((previous) => [
      ...previous,
      {
        question: questions[questionIndex],
        answer: currentAnswer,
      },
    ]);

    setCurrentAnswer("");

    if (questionIndex < questions.length - 1) {
      setQuestionIndex((previous) => previous + 1);
    } else {
      setScreen("documents");
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice recognition is not supported in this browser. You can type your answer instead."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setCurrentAnswer((previous) =>
        previous ? `${previous} ${text}` : text
      );
    };

    recognition.onerror = () => {
      alert("Voice input could not be captured. Please try again.");
    };

    recognition.start();
  };
const updateSummaryField = (field, value) => {
  setSummary((previous) => ({
    ...previous,
    [field]: value,
  }));
};
const handleDocumentUpload = async (event) => {
  const files = Array.from(event.target.files);

  const processed = [];

  for (const file of files) {
    let extractedText = "";

    if (file.type.startsWith("image/")) {
      try {
        const result = await Tesseract.recognize(file, "eng", {
          logger: (info) => {
            console.log(info);
          },
        });

        extractedText = result.data.text;
} catch (error) {
        console.error("OCR failed:", error);

        extractedText = "OCR could not extract text.";
      }
    }


processed.push({
  name: file.name,
  type: file.type,
  healthcareSystem: patient.healthcareSystem || "Not reported",
  extracted: true,
  extractedText: extractedText,
});
  }

  setDocuments((previous) => [...previous, ...processed]);
};

  const generateSummary = () => {
    const generatedSummary = {
      patient: patient.name,
      age: patient.age,
      gender: patient.gender || "Not reported",
      healthcareSystem: patient.healthcareSystem || "Not reported",
      id: patient.id || "DEMO-" + Math.floor(Math.random() * 9000 + 1000),
      chiefComplaint:
        selectedSymptoms.length > 0
          ? selectedSymptoms.join(", ")
          : complaint,
allergies:
  answers[0]?.answer?.trim().toLowerCase() === "no"
    ? "No known allergies reported"
    : answers[0]?.answer?.trim() || "Not reported",

          medicineSuggestion: medicineSuggestions[complaint] || null,

hpi:
  answers.length > 0
    ? answers.map((item) => `${item.question} ${item.answer}`).join("|||")
    : "History not reported.",
pastHistory:
  answers[1]?.answer?.trim() || "No previous medical history reported.",

medications:
  answers[2]?.answer?.trim() || "No current medications reported.",

  previousAyushTreatment:
  answers[3]?.answer?.trim() || "Not reported",

ayushMedicines:
  answers[4]?.answer?.trim() || "Not reported",
      documents: documents.length,
timeline: [
  {
    year: "2026",
    event: "Patient registered and medical history collected",
  },
  {
    year: "2026",
    event: `Current complaint reported: ${
      selectedSymptoms.join(", ") || complaint
    }`,
  },
  ...(documents.length > 0
    ? [
        {
          year: "2026",
          event: `${documents.length} previous medical document${
            documents.length > 1 ? "s" : ""
          } processed`,
        },
      ]
    : []),
  {
    year: "2026",
    event: "Medical summary generated and sent for doctor review",
  },
],
    };

    setSummary(generatedSummary);
    setScreen("summary");
  };

  const resetApp = () => {
    setScreen("home");
    setPatient({
      name: "",
      age: "",
      gender: "",
      id: "",
    });
    setComplaint("");
    setSelectedSymptoms([]);
    setQuestionIndex(0);
    setAnswers([]);
    setCurrentAnswer("");
    setDocuments([]);
    setTranscript("");
    setSummary(null);
    setVerified(false);
    setRedFlag(false);
    setMedicineApproved(false);
setMedicineRejected(false);
  };

  return (
    <div className="app">
      <header className="navbar">
        <div className="brand" onClick={resetApp}>
          <div className="brand-icon">✚</div>
          <div>
            <strong>MedBridge</strong>
            <span>AI</span>
          </div>
        </div>

        <div className="nav-right">
          <span className="secure">🔒 Secure Demo</span>

          <button
            className="doctor-nav"
            onClick={() => {
              if (summary) {
                setScreen("doctor");
              } else {
                alert("Complete a patient intake first.");
              }
            }}
          >
            Doctor Dashboard
          </button>
        </div>
      </header>

      <main>
        {screen === "home" && (
          <section className="welcome-screen">
            <div className="welcome-content">
              <div className="welcome-badge">
                AI-POWERED CLINICAL INTAKE
              </div>

              <h1>
                Your Story.
                <br />
                <span>Structured for Care.</span>
              </h1>

              <p>
                MedBridge AI helps patients share their medical history
                through voice, touch, and previous medical documents before
                meeting the doctor.
              </p>

<div className="ayush-badge">
  <span>AYUSH-INTEGRATED HEALTHCARE</span>
  <p>Aligned with the vision of the Ministry of AYUSH</p>
</div>

              <div className="welcome-actions">
                <button className="primary-button" onClick={startIntake}>
                  Start Patient Intake →
                </button>

                <button
                  className="secondary-button"
                  onClick={() => {
                    if (summary) {
                      setScreen("doctor");
                    } else {
                      alert("Complete a patient intake first.");
                    }
                  }}
                >
                  Doctor Dashboard
                </button>
              </div>

              <div className="feature-row">
                <div>
                  <span>🎙️</span>
                  <strong>Voice</strong>
                  <small>Speak naturally</small>
                </div>

                <div>
                  <span>👆</span>
                  <strong>Touch</strong>
                  <small>Simple answers</small>
                </div>

                <div>
                  <span>📄</span>
                  <strong>Documents</strong>
                  <small>Scan old records</small>
                </div>

                <div>
                  <span>🧠</span>
                  <strong>AI</strong>
                  <small>Structured history</small>
                </div>
              </div>
            </div>

            <div className="workflow-card">
              <div className="workflow-title">
                <span>HOW IT WORKS</span>
                <b>Patient → Doctor</b>
              </div>

              <div className="workflow-step active">
                <div>01</div>
                <section>
                  <strong>Patient arrives</strong>
                  <small>Self-service intake begins</small>
                </section>
              </div>

              <div className="workflow-line"></div>

              <div className="workflow-step">
                <div>02</div>
                <section>
                  <strong>AI collects history</strong>
                  <small>Voice + touch + documents</small>
                </section>
              </div>

              <div className="workflow-line"></div>

              <div className="workflow-step">
                <div>03</div>
                <section>
                  <strong>Doctor receives summary</strong>
                  <small>Verified clinical information</small>
                </section>
              </div>
            </div>
          </section>
        )}

        {screen === "registration" && (
          <section className="intake-page">
            <Progress current={1} />

            <div className="intake-card">
              <div className="step-label">STEP 1 OF 5</div>

              <h2>Let's get to know you</h2>

              <p className="muted">
                Enter basic information before starting your medical history.
              </p>

              <div className="form-grid">
                <label>
                  Patient Name
                  <input
                    value={patient.name}
                    onChange={(e) =>
                      setPatient({ ...patient, name: e.target.value })
                    }
                    placeholder="Enter patient name"
                  />
                </label>

                <label>
                  Age
                  <input
                    type="number"
                    value={patient.age}
                    onChange={(e) =>
                      setPatient({ ...patient, age: e.target.value })
                    }
                    placeholder="Age"
                  />
                </label>

                <label>
                  Gender
                  <select
                    value={patient.gender}
                    onChange={(e) =>
                      setPatient({ ...patient, gender: e.target.value })
                    }
                  >
                    <option value="">Select</option>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                    <option>Prefer not to say</option>
                  </select>
                </label>

<label>
  Preferred Healthcare System
  <select
    value={patient.healthcareSystem || ""}
    onChange={(e) =>
      setPatient({
        ...patient,
        healthcareSystem: e.target.value,
      })
    }
  >
    <option value="">Select healthcare system</option>
    <option>Allopathy</option>
    <option>Ayurveda</option>
    <option>Yoga & Naturopathy</option>
    <option>Unani</option>
    <option>Siddha</option>
    <option>Homoeopathy</option>
    <option>Integrated Care</option>
  </select>
</label>

                <label>
                  Demo / Patient ID
                  <input
                    value={patient.id}
                    onChange={(e) =>
                      setPatient({ ...patient, id: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </label>
              </div>

              <div className="privacy-note">
                🔒 Your information is used only for this demonstration.
              </div>

              <button
                className="primary-button full"
                onClick={continueRegistration}
              >
                Continue →
              </button>
            </div>
          </section>
        )}

        {screen === "symptoms" && (
          <section className="intake-page">
            <Progress current={2} />

            <div className="intake-card">
              <div className="step-label">STEP 2 OF 5</div>

              <h2>What are you experiencing?</h2>

              <p className="muted">
                Select everything that applies. You can also describe your
                symptoms using your voice.
              </p>

              <div className="symptom-grid">
                {symptoms.map((symptom) => (
                  <button
                    key={symptom}
                    className={
                      selectedSymptoms.includes(symptom)
                        ? "symptom selected"
                        : "symptom"
                    }
                    onClick={() => toggleSymptom(symptom)}
                  >
                    <span>
                      {selectedSymptoms.includes(symptom) ? "✓" : "+"}
                    </span>
                    {symptom}
                  </button>
                ))}
              </div>

              <div className="voice-box">
                <div>
                  <span className="voice-icon">🎙️</span>
                  <div>
                    <strong>Prefer speaking?</strong>
                    <small>Tell us what you're experiencing.</small>
                  </div>
                </div>
<button
  className="voice-button"
  onClick={() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice recognition is not supported by Safari. Please use the symptom buttons below."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setTranscript("🎙️ Listening... Please speak now.");
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;

      setTranscript(text);

      // Simple symptom detection for the prototype
      const lowerText = text.toLowerCase();

      const detectedSymptoms = symptoms.filter((symptom) => {
        const words = symptom.toLowerCase().split(" ");

        return words.some((word) => lowerText.includes(word));
      });

      if (detectedSymptoms.length > 0) {
        setSelectedSymptoms((previous) => [
          ...new Set([...previous, ...detectedSymptoms]),
        ]);
      }
    };

    recognition.onerror = (event) => {
      console.log("Speech recognition error:", event.error);

      setTranscript(
        "⚠️ Voice could not be captured. Please try again or select symptoms manually."
      );
    };

    recognition.onend = () => {
      console.log("Speech recognition ended.");
    };

    try {
      recognition.start();
    } catch (error) {
      console.log("Could not start speech recognition:", error);

      setTranscript(
        "⚠️ Could not start the microphone. Please try again."
      );
    }
  }}
>
  🎙️ Start speaking
</button>        
              </div>

              {transcript && (
                <div className="transcript">
                  <strong>You said:</strong> {transcript}
                </div>
              )}

              <button
                className="primary-button full"
                onClick={continueSymptoms}
              >
                Continue →
              </button>
            </div>
          </section>
        )}

        {screen === "questions" && (
          <section className="intake-page">
            <Progress current={3} />

            <div className="intake-card question-card">
              <div className="step-label">
                STEP 3 OF 5 · ADAPTIVE AI INTERVIEW
              </div>

              <div className="question-number">
                Question {questionIndex + 1} of {questions.length}
              </div>

              <h2>{questions[questionIndex]}</h2>
{isPainSeverityQuestion && (
  <div className="pain-options">
    {painOptions.map((option) => (
      <button
        key={option.value}
        type="button"
        className={`pain-option ${
          currentAnswer === option.value ? "selected" : ""
        }`}
        onClick={() => setCurrentAnswer(option.value)}
      >
        <span className="pain-emoji">{option.emoji}</span>
        <strong>{option.label}</strong>
      </button>
    ))}
  </div>
)}
              <p className="muted">
                Your answer helps create a structured history for the doctor.
              </p>

              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows="5"
              />

              <button
                className="voice-large"
                onClick={handleVoiceInput}
              >
                🎙️ Speak your answer
              </button>

              <button className="primary-button full" onClick={submitAnswer}>
                {questionIndex === questions.length - 1
                  ? "Continue to Documents →"
                  : "Next Question →"}
              </button>
            </div>
          </section>
        )}

        {screen === "documents" && (
          <section className="intake-page">
            <Progress current={4} />

            <div className="intake-card">
              <div className="step-label">STEP 4 OF 5 · PREVIOUS RECORDS</div>

              <h2>Do you have previous medical documents?</h2>

              <p className="muted">
                Upload prescriptions, lab reports, discharge summaries, or
                other medical records.
              </p>

              <label className="upload-box">
                <input
                  type="file"
                  multiple
accept=".jpg,.jpeg,.png"
                  onChange={handleDocumentUpload}
                />

                <span className="upload-icon">📄</span>
                <strong>Upload medical documents</strong>
<small>JPG, JPEG or PNG</small>
              </label>

              {documents.length > 0 && (
                <div className="document-list">
                  {documents.map((document, index) => (
                    <div className="document-item" key={index}>
                      <span>📄</span>

                      <div>
                        <strong>{document.name}</strong>
                        <small>
                          ✓ OCR complete · Medical information extracted
                        </small>
                      </div>

                      <b>Processed</b>
                    </div>
                  ))}
                </div>
              )}

              <div className="ocr-info">
                <span>✦</span>
                <div>
                  <strong>AI document extraction</strong>
                  <small>
                    The prototype extracts dates, medicines and investigations
                    from uploaded records.
                  </small>
                </div>
              </div>

              <button
                className="primary-button full"
                onClick={generateSummary}
              >
                Generate Medical History →
              </button>

              <button
                className="skip-button"
                onClick={generateSummary}
              >
                Skip documents
              </button>
            </div>
          </section>
        )}

        {screen === "summary" && summary && (
          <section className="summary-page">
            <div className="summary-header">
              <div>
                <div className="step-label">STEP 5 OF 5 · AI SUMMARY</div>
                <h2>Patient history is ready</h2>
                <p>
                  AI has organized the information for doctor verification.
                </p>
              </div>

              {redFlag && (
                <div className="red-alert">
                  <span>⚠</span>
                  <div>
                    <strong>Priority assessment recommended</strong>
                    <small>
                      High-risk symptom selected. Human clinical assessment
                      required.
                    </small>
                  </div>
                </div>
              )}
            </div>

            <div className="summary-grid">
              <div className="summary-card patient-overview">
                <div className="card-top">
                  <span>Patient</span>
                  <b>DEMO</b>
                </div>

                <h3>{summary.patient}</h3>

                <p>
                  {summary.age} years · {summary.gender}
                </p>

                <div className="mini-info">
                  <div>
                    <small>Patient ID</small>
                    <strong>{summary.id}</strong>
                  </div>

                  <div>
                    <small>Documents</small>
                    <strong>{summary.documents} found</strong>
                  </div>
                </div>
              </div>

              <div className="summary-card">
                <div className="card-top">
                  <span>Chief Complaint</span>
                  <b>AI</b>
                </div>

                <h3>{summary.chiefComplaint}</h3>

<div className="hpi-list">
  {summary.hpi
    ?.split("|||")
    .filter(item => item.trim())
    .map((item, index) => {
      const parts = item.trim().split("?");
      const question = parts[0].trim() + "?";
      const answer = parts.slice(1).join("?").trim();

      return (
        <div className="hpi-item" key={index}>
          <strong>{question}</strong>
          {answer && <span>{answer}</span>}
        </div>
      );
    })}
</div>
              </div>

              <div className="summary-card">
                <div className="card-top">
                  <span>Medical History</span>
                  <b>EXTRACTED</b>
                </div>

                <div className="history-row">
                  <span>Past History</span>
                  <strong>{summary.pastHistory}</strong>
                </div>

                <div className="history-row">
                  <span>Medication</span>
                  <strong>{summary.medications}</strong>
                </div>

                <div className="history-row">
                  <span>Allergies</span>
                  <strong>{summary.allergies}</strong>
                </div>
              </div>

              <div className="summary-card timeline-card">
                <div className="card-top">
                  <span>Patient Timeline</span>
                  <b>CHRONOLOGY</b>
                </div>

                <div className="timeline">
                  {summary.timeline.map((event, index) => (
                    <div className="timeline-item" key={index}>
                      <div className="timeline-dot"></div>
                      <div>
                        <strong>{event.year}</strong>
                        <p>{event.event}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="summary-actions">
              <button
                className="secondary-button"
onClick={() => setScreen("patientPortal")}
              >
                View Patient Portal
              </button>

{summary.medicineSuggestion && (
  <div className="medicine-suggestion-card">
    <div className="medicine-suggestion-header">
      <span className="medicine-icon">💊</span>

      <div>
        <h3>Medication Review</h3>

        <span className="doctor-review-badge">
          Doctor Approval Required
        </span>
      </div>
    </div>

    {!medicineApproved && !medicineRejected && (
      <div className="medicine-suggestion-content">
        <p>
          A medication suggestion has been generated based on the
          reported symptoms and is waiting for doctor review.
        </p>

        <small>
          No medication has been approved yet.
        </small>
      </div>
    )}

    {medicineApproved && (
      <div className="medicine-suggestion-content approved">
        <strong>
          {summary.medicineSuggestion.medicine}
        </strong>

        <p>
          {summary.medicineSuggestion.reason}
        </p>

        <small>
          ✓ Approved by doctor. This suggestion is for demonstration
          purposes and is not a prescription.
        </small>
      </div>
    )}

    {medicineRejected && (
      <div className="medicine-suggestion-content rejected">
        <p>
          The medication suggestion was not approved by the doctor.
        </p>

        <small>
          Please follow the doctor's clinical advice.
        </small>
      </div>
    )}
  </div>
)}
              <button
                className="primary-button"
                onClick={() => setScreen("doctor")}
              >
                Send to Doctor Dashboard →
              </button>
            </div>
          </section>
        )}
{screen === "patientPortal" && (
  <section className="patient-portal-page">

    <div className="patient-portal-header">
      <div>
        <div className="step-label">PATIENT PORTAL</div>

        <h1>Welcome, {patient.name || "Patient"}</h1>

        <p>
          Your personal healthcare information in one place.
        </p>
      </div>

      <button
        className="portal-back-button"
        onClick={() => setScreen("summary")}
      >
        ← Back to Medical Summary
      </button>
    </div>

    {/* PATIENT PROFILE */}
    <div className="portal-card profile-card">

      <div className="portal-card-title">
        <span>👤</span>
        <h2>My Profile</h2>
      </div>

      <div className="profile-grid">

        <div>
          <small>Patient Name</small>
          <strong>{patient.name || "Not reported"}</strong>
        </div>

        <div>
          <small>Age</small>
          <strong>{patient.age || "Not reported"}</strong>
        </div>

        <div>
          <small>Gender</small>
          <strong>{patient.gender || "Not reported"}</strong>
        </div>

        <div>
          <small>Patient ID</small>
          <strong>
            {summary?.id || patient.id || "DEMO-ID"}
          </strong>
        </div>

      </div>
    </div>

    {/* CURRENT VISIT */}
    <div className="portal-card">

      <div className="portal-card-title">
        <span>🩺</span>
        <h2>Current Visit</h2>
      </div>

<div
  className={`visit-status ${
    verified ? "verified" : rejected ? "rejected" : "pending"
  }`}
>
  <span className="status-dot"></span>

  <strong>
    {verified
      ? "Verified by Doctor"
      : rejected
      ? "Rejected — Needs Review"
      : "Pending Doctor Review"}
  </strong>
</div>

<div className="visit-details">
  <div>
    <small>Chief Complaint</small>
    <strong>{summary?.chiefComplaint || "Not reported"}</strong>
  </div>

  <div>
    <small>Healthcare System</small>
    <strong>
      {summary?.healthcareSystem || "Not reported"}
    </strong>
  </div>

        <div>
          <small>Documents</small>
          <strong>
            {documents.length} processed
          </strong>
        </div>

      </div>
    </div>

    {/* MEDICATION */}
    {summary?.medicineSuggestion && (
      <div className="portal-card medication-portal-card">

        <div className="portal-card-title">
          <span>💊</span>
          <h2>Medication</h2>
        </div>

        {!medicineApproved && !medicineRejected && (
          <div className="portal-pending">
            <strong>Doctor review pending</strong>

            <p>
              A medication suggestion is currently waiting
              for doctor approval.
            </p>
          </div>
        )}

        {medicineApproved && (
          <div className="portal-approved">
            <span>✓</span>

            <div>
              <strong>
                {summary.medicineSuggestion.medicine}
              </strong>

              <p>
                Approved by doctor for this demo workflow.
              </p>
            </div>
          </div>
        )}

        {medicineRejected && (
          <div className="portal-rejected">
            <span>✕</span>

            <div>
              <strong>Suggestion not approved</strong>

              <p>
                The doctor did not approve the AI-generated
                medication suggestion.
              </p>
            </div>
          </div>
        )}

      </div>
    )}

    {/* MEDICAL HISTORY */}
    <div className="portal-card">

      <div className="portal-card-title">
        <span>🧾</span>
        <h2>Medical History</h2>
      </div>

      <div className="history-grid">

        <div>
          <small>Past History</small>
          <p>
            {summary?.pastHistory || "No previous history reported."}
          </p>
        </div>

        <div>
          <small>Allergies</small>
          <p>
            {summary?.allergies || "Not reported"}
          </p>
        </div>

        <div>
          <small>Current Medication</small>
          <p>
            {summary?.medications || "Not reported"}
          </p>
        </div>

      </div>
    </div>

    {/* DOCUMENTS */}
    <div className="portal-card">

      <div className="portal-card-title">
        <span>📄</span>
        <h2>My Documents</h2>
      </div>

      {documents.length === 0 ? (

        <div className="empty-portal-state">
          <span>📂</span>
          <p>No medical documents uploaded.</p>
        </div>

      ) : (

<div className="portal-document-list">
  {documents.map((document, index) => (
    <div className="portal-document" key={index}>
      <span>📄</span>

      <div>
        <strong>{document.name}</strong>

        <small>
          ✓ Processed · {document.healthcareSystem || "Healthcare record"}
        </small>
      </div>
    </div>
  ))}
</div>

      )}

    </div>

    {/* PATIENT TIMELINE */}
    <div className="portal-card">

      <div className="portal-card-title">
        <span>📅</span>
        <h2>My Health Timeline</h2>
      </div>

<div className="portal-timeline">
  {summary?.timeline?.map((item, index) => (
    <div className="portal-timeline-item" key={index}>
      <div className="timeline-dot"></div>

      <div>
        <strong>{item.year}</strong>
        <p>{item.event}</p>
      </div>
    </div>
  ))}

  {/* DOCTOR REVIEW STATUS */}
  <div className="portal-timeline-item">
    <div className="timeline-dot"></div>

    <div>
      <strong>2026</strong>

      <p>
        {verified
          ? "Doctor verified the medical summary"
          : rejected
          ? "Doctor requested changes to the medical summary"
          : "Medical summary is awaiting doctor review"}
      </p>
    </div>
  </div>
</div>
    </div>

    {/* QUICK ACTIONS */}
    <div className="portal-card">

      <div className="portal-card-title">
        <span>⚡</span>
        <h2>Quick Actions</h2>
      </div>

      <div className="portal-actions">

        <button onClick={() => setScreen("summary")}>
          🧾 View Medical Summary
        </button>

        <button onClick={() => setScreen("documents")}>
          📄 View Documents
        </button>

        <button onClick={() => setScreen("home")}>
          🏠 Return Home
        </button>

      </div>

    </div>

    <div className="portal-privacy-note">
      🔒 Demo patient portal · Information is displayed for
      prototype demonstration and should be verified by a
      healthcare professional.
    </div>

  </section>
)}
        {screen === "doctor" && summary && (
          <section className="doctor-page">
            <div className="doctor-header">
              <div>
                <div className="step-label">CLINICIAN WORKSPACE</div>
                <h2>Doctor Dashboard</h2>
                <p>Review the AI-generated patient intake before consultation.</p>
              </div>

              <div className="doctor-status">
                <span>●</span> Intake completed
              </div>
            </div>

            {redFlag && (
              <div className="doctor-alert">
                <div className="alert-icon">⚠</div>
                <div>
                  <strong>Priority Alert — Human assessment required</strong>
                  <p>
                    The intake contains a predefined high-risk symptom.
                    This system does not diagnose medical conditions.
                  </p>
                </div>
              </div>
            )}

            <div className="doctor-layout">
              <aside className="patient-sidebar">
                <div className="avatar">👤</div>

                <h3>{summary.patient}</h3>
                <p>
                  {summary.age} years · {summary.gender}
                </p>

                <div className="sidebar-item">
                  <small>Patient ID</small>
                  <strong>{summary.id}</strong>
                </div>

                <div className="sidebar-item">
                  <small>Chief Complaint</small>
                  <strong>{summary.chiefComplaint}</strong>
                </div>

                <div className="sidebar-item">
                  <small>Documents</small>
                  <strong>{summary.documents} processed</strong>
                </div>

                <div className="verification-box">
                  <span>✓</span>
                  <div>
                    <strong>AI-generated</strong>
                    <small>Doctor verification required</small>
                  </div>
                </div>
              </aside>

              <div className="doctor-content">
                <div className="doctor-card">
                  <div className="doctor-card-title">
                    <div>
                      <span>01</span>
                      <h3>Clinical Summary</h3>
                    </div>
                    <b>AI GENERATED</b>
                  </div>

<div className="clinical-grid">

  {/* CHIEF COMPLAINT */}
  <div>
    <label>Chief Complaint</label>

    {editing ? (
      <textarea
        value={summary.chiefComplaint || ""}
        onChange={(e) =>
          updateSummaryField("chiefComplaint", e.target.value)
        }
      />
    ) : (
      <p>{summary.chiefComplaint}</p>
    )}
  </div>

{/* HEALTHCARE SYSTEM */}
<div>
  <label>Preferred Healthcare System</label>

  <p>{summary.healthcareSystem}</p>
</div>

  {/* ALLERGIES */}
  <div>
    <label>Allergies</label>

    {editing ? (
      <textarea
        value={summary.allergies || ""}
        onChange={(e) =>
          updateSummaryField("allergies", e.target.value)
        }
      />
    ) : (
      <p>{summary.allergies}</p>
    )}
  </div>


  {/* HPI */}
  <div className="wide">
    <label>History of Present Illness</label>

    {editing ? (
      <textarea
        className="hpi-editor"
        value={summary.hpi || ""}
        onChange={(e) =>
          updateSummaryField("hpi", e.target.value)
        }
        placeholder="Edit the patient's history..."
      />
    ) : (
      <div className="hpi-list">
        {summary.hpi
          ?.split("|||")
          .filter((item) => item.trim())
          .map((item, index) => {
            const parts = item.trim().split("?");
            const question = parts[0].trim() + "?";
            const answer = parts.slice(1).join("?").trim();

            return (
              <div className="hpi-item" key={index}>
                <strong>{question}</strong>
                {answer && <span>{answer}</span>}
              </div>
            );
          })}
      </div>
    )}
  </div>


  {/* PAST HISTORY */}
  <div>
    <label>Past History</label>

    {editing ? (
      <textarea
        value={summary.pastHistory || ""}
        onChange={(e) =>
          updateSummaryField("pastHistory", e.target.value)
        }
      />
    ) : (
      <p>{summary.pastHistory}</p>
    )}
  </div>

{/* AYUSH CLINICAL CONTEXT */}
<div className="wide">
  <label>AYUSH Clinical Context</label>

  <div className="ayush-context">
    <p>
      <strong>Preferred System:</strong>{" "}
      {summary.healthcareSystem || "Not reported"}
    </p>

    <p>
      <strong>Previous AYUSH Treatment:</strong>{" "}
      {summary.previousAyushTreatment || "Not reported"}
    </p>

    <p>
      <strong>AYUSH Medicines / Products:</strong>{" "}
      {summary.ayushMedicines || "Not reported"}
    </p>
  </div>
</div>

  {/* CURRENT MEDICATION */}
  <div>
    <label>Current Medication</label>

    {editing ? (
      <textarea
        value={summary.medications || ""}
        onChange={(e) =>
          updateSummaryField("medications", e.target.value)
        }
      />
    ) : (
      <p>{summary.medications}</p>
    )}
  </div>

</div>
                </div>

                <div className="doctor-card">
                  <div className="doctor-card-title">
                    <div>
                      <span>02</span>
                      <h3>Previous Documents</h3>
                    </div>
                  </div>

                  {documents.length > 0 ? (
                    documents.map((document, index) => (
<div className="doctor-document" key={index}>
  <span>📄</span>

  <div>
    <strong>{document.name}</strong>

    <small>
      OCR extracted · Date, medicine and investigation identified
    </small>

    <small className="document-healthcare-system">
      Healthcare System: {document.healthcareSystem || "Not reported"}
    </small>
  </div>

<button
  onClick={() => setSelectedDocument(document)}
>
  View
</button>
</div>
                    ))
                  ) : (
                    <p className="muted">No previous documents uploaded.</p>
                  )}
                </div>

                {/* DOCUMENT VIEWER */}
                {selectedDocument && (
                  <div className="document-viewer-overlay">
                    <div className="document-viewer">

                      <div className="document-viewer-header">
                        <div>
                          <span className="step-label">OCR DOCUMENT</span>
                          <h2>{selectedDocument.name}</h2>
                        </div>

                        <button
                          className="document-close-button"
                          onClick={() => setSelectedDocument(null)}
                        >
                          ✕
                        </button>
                      </div>

                      <div className="document-info">
                        <p>
                          <strong>Healthcare System:</strong>{" "}
                          {selectedDocument.healthcareSystem || "Not reported"}
                        </p>

                        <p>
                          <strong>Status:</strong> OCR Processed
                        </p>
                      </div>

                      <div className="ocr-content">
                        <h3>Extracted Information</h3>

                        <div className="ocr-text">
                          {selectedDocument.extractedText ||
                            "No OCR text is available for this document."}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                <div className="doctor-card">
                  <div className="doctor-card-title">
                    <div>
                      <span>03</span>
                      <h3>Patient Timeline</h3>
                    </div>
                  </div>

                  <div className="doctor-timeline">
                    {summary.timeline.map((event, index) => (
                      <div key={index}>
                        <div className="timeline-dot"></div>
                        <section>
                          <strong>{event.year}</strong>
                          <p>{event.event}</p>
                        </section>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="verification-panel">
                  <div>
                    <h3>Doctor Verification</h3>
                    <p>
                      Review the AI-generated information before using it for
                      clinical decision-making.
                    </p>
                  </div>
                  {summary?.medicineSuggestion && (
  <div className="medicine-review-card">
    <div className="medicine-review-header">
      <span className="medicine-icon">💊</span>

      <div>
        <h3>AI Medication Suggestion</h3>
        <p>Review before patient notification</p>
      </div>
    </div>

    <div className="medicine-review-content">
      <strong>
        {summary.medicineSuggestion.medicine}
      </strong>

      <p>
        {summary.medicineSuggestion.reason}
      </p>
    </div>

    <div className="medicine-review-actions">
      <button
        className="reject"
        onClick={() => {
          setMedicineRejected(true);
          setMedicineApproved(false);
        }}
      >
        {medicineRejected ? "✕ Rejected" : "Reject"}
      </button>

      <button
        className="accept"
        onClick={() => {
          setMedicineApproved(true);
          setMedicineRejected(false);
        }}
      >
        {medicineApproved ? "✓ Approved" : "Approve"}
      </button>
    </div>

    {medicineApproved && (
      <div className="medicine-status approved">
        ✓ Medication suggestion approved by doctor.
      </div>
    )}

    {medicineRejected && (
      <div className="medicine-status rejected">
        ✕ Medication suggestion rejected by doctor.
      </div>
    )}
  </div>
)}
<div className="verification-buttons">
<button
  className="reject"
  onClick={() => {
    setRejected(true);
    setVerified(false);
  }}
>
  {rejected ? "✕ Rejected" : "Reject"}
</button>

  <button
    className="edit"
    onClick={() => setEditing(!editing)}
  >
    {editing ? "Done Editing" : "Edit"}
  </button>

<button
  className="accept"
  onClick={() => {
    setVerified(true);
    setRejected(false);
  }}
>
  {verified ? "✓ Verified" : "Accept & Verify"}
</button>
</div>

{editing && (
  <div className="edit-note">
    <p>
      Edit mode enabled. Doctor can review and modify the AI-generated
      information before verification.
    </p>
  </div>
)}
<button
  className="patient-view-button"
  onClick={() => setScreen("summary")}
>
  ← Back to Patient View
</button>
                  
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer>
        <strong>MedBridge AI</strong>
        <span>
          Prototype · AI assists healthcare professionals and does not replace
          clinical judgment.
        </span>
      </footer>
    </div>
  );
}

function Progress({ current }) {
  return (
    <div className="progress">
      {[1, 2, 3, 4, 5].map((number) => (
        <div
          key={number}
          className={
            number <= current ? "progress-step completed" : "progress-step"
          }
        >
          <span>{number}</span>
          {number < 5 && <i></i>}
        </div>
      ))}
    </div>
  );
}

export default App;