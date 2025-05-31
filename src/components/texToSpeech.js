import React, { useEffect } from "react";

const TextToSpeech = ({ text }) => {
  useEffect(() => {
    if (text) {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      synth.speak(utterance);

      return () => {
        synth.cancel();
      };
    }
  }, [text]);

  return null;
};

export default TextToSpeech;