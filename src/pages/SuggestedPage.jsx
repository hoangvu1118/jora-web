import { useEffect, useState } from "react";
import { getRecommendations } from "../api/recommendations";
import PageHeader from "../components/PageHeader";
import { PageError, PageLoading } from "../components/PageStatus";
import SwipeDeck from "../components/SwipeDeck";

const PAGE_SIZE = 50;

// Tinder-style review of NEW matches: right = SAVED, left = DISMISSED.
export default function SuggestedPage() {
  // 1. State
  const [newMatches, setNewMatches] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState("");

  // 2. Load once
  useEffect(function () {
    loadNewMatches();
  }, []);

  // 3. Handlers
  async function loadNewMatches() {
    setStatus("loading");
    try {
      const page = await getRecommendations(null, PAGE_SIZE);
      const onlyNew = [];
      for (const match of page.items) {
        if (match.recommendationStatus === "NEW") {
          onlyNew.push(match);
        }
      }
      setNewMatches(onlyNew);
      setStatus("ready");
    } catch (error) {
      setErrorMessage(error.message);
      setStatus("error");
    }
  }

  // 4. Decide what to show
  if (status === "loading") {
    return <PageLoading title="Suggested for you" />;
  }
  if (status === "error") {
    return <PageError title="Suggested for you" message={errorMessage} onRetry={loadNewMatches} />;
  }

  // 5. Render
  return (
    <div className="page page-deck">
      <SwipeDeck
        matches={newMatches}
        head={<PageHeader title="Suggested for you" sub="New matches for your search profile. Saved ones also appear in Jobs." />}
      />
    </div>
  );
}
