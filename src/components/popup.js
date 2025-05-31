// src/components/Popup.js
import React, { useEffect, useState } from "react";
import "../assets/popup.css";
import useSpeechToText from "react-hook-speech-to-text";
import Wave from "react-wavify";
import KeyboardVoiceIcon from "@mui/icons-material/KeyboardVoice";
import SettingsVoiceIcon from "@mui/icons-material/SettingsVoice";
import TextToSpeech from "./texToSpeech";
import Switch from "@mui/material/Switch";

const Popup = () => {
  const [text, setText] = useState("");
  const [detectMode, setDetectMode] = useState(false);

  const {
    results,
    isRecording,
    startSpeechToText,
    stopSpeechToText,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
    timeout: 150000,
  });

  const refreshPage = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id;
      if (results.length > 0) {
        const data = {
          message: "messageFromPopup",
          payload: results,
          action: "refresh",
          tabId,
          url: tabs[0].url,
        };
        chrome.runtime.sendMessage(data);
      }
    });
  };

  useEffect(() => {
    if (results.length > 0) {
      const lastTranscript = results[results.length - 1]?.transcript || "";
      const cleanedText = lastTranscript.replaceAll(/[- )(.,;]/g, "").toLowerCase();

      if (cleanedText.includes("activatechatmode")) {
        setDetectMode(true);
      } else if (cleanedText.includes("deactivatechatmode")) {
        setDetectMode(false);
        refreshPage();
      } else {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tabId = tabs[0].id;
          const data = {
            message: detectMode ? "messageFromPopupchat" : "messageFromPopup",
            payload: results,
            tabId,
            prompt: cleanedText,
            url: tabs[0].url,
          };
          chrome.runtime.sendMessage(data);
        });
      }
    }
  }, [results]);

  useEffect(() => {
    chrome.runtime.onMessage.addListener((message) => {
      if (message?.prompt) {
        setText(message.prompt);
      }
    });
  }, []);

  return (
    <div className="parentContainer">
      <div className="wraper">
        <div onClick={isRecording ? stopSpeechToText : startSpeechToText}>
          {isRecording ? (
            <SettingsVoiceIcon
              sx={{
                fontSize: 30,
                padding: "20px 40px 10px 40px",
                color: "#04094f",
                cursor: "pointer",
              }}
            />
          ) : (
            <KeyboardVoiceIcon
              sx={{
                fontSize: 30,
                padding: "20px 40px 10px 40px",
                color: "#04094f",
                cursor: "pointer",
              }}
            />
          )}
        </div>

        <Switch
          checked={detectMode}
          onChange={(e) => setDetectMode(e.target.checked)}
          inputProps={{ "aria-label": "controlled" }}
          sx={{
            fontSize: 30,
            margin: "20px 40px 10px 40px",
            color: "#03fcf4",
          }}
        />
      </div>

      <div className="chatSection">
        {results.map((result) => (
          <p style={{ color: "black", paddingLeft: "10px" }} key={result.timestamp}>
            {result.transcript},
          </p>
        ))}
      </div>

      <div className="response">
        {text ? <div className="chatresponse">{text}</div> : null}
      </div>

      <Wave
        fill="#f79902"
        paused={false}
        options={{
          height: 30,
          amplitude: 5,
          speed: 2,
          points: 4,
        }}
        className="wave"
      />

      {text && <TextToSpeech text={text} />}
    </div>
  );
};

export default Popup;
