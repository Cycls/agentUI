import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
} from "react";

// ───────────────────────────────────────────────────────────────────────────────
// Canvas Context - manages document canvas state
// ───────────────────────────────────────────────────────────────────────────────

const initialState = {
  isOpen: false,
  title: "",
  content: "",
  isStreaming: false,
  isDone: false,
  canvasType: "document",
};

const CanvasActions = {
  OPEN: "OPEN",
  OPEN_EXISTING: "OPEN_EXISTING",
  CLOSE: "CLOSE",
  APPEND_CONTENT: "APPEND_CONTENT",
  UPDATE_CONTENT: "UPDATE_CONTENT",
  DONE: "DONE",
  RESET: "RESET",
};

function canvasReducer(state, action) {
  switch (action.type) {
    case CanvasActions.OPEN:
      return {
        ...initialState,
        isOpen: true,
        title: action.payload?.title || "Untitled",
        content: action.payload?.content || "",
        isStreaming: true,
        isDone: false,
        canvasType: action.payload?.canvasType || "document",
      };

    case CanvasActions.OPEN_EXISTING:
      // Open canvas with existing content (not streaming, already complete)
      return {
        ...initialState,
        isOpen: true,
        title: action.payload?.title || "Untitled",
        content: action.payload?.content || "",
        isStreaming: false,
        isDone: true,
        canvasType: action.payload?.canvasType || "document",
      };

    case CanvasActions.CLOSE:
      return {
        ...state,
        isOpen: false,
      };

    case CanvasActions.APPEND_CONTENT:
      return {
        ...state,
        content: state.content + (action.payload || ""),
      };

    case CanvasActions.UPDATE_CONTENT:
      // For user edits after streaming is complete
      return {
        ...state,
        content: action.payload || "",
      };

    case CanvasActions.DONE:
      return {
        ...state,
        isStreaming: false,
        isDone: true,
      };

    case CanvasActions.RESET:
      return initialState;

    default:
      return state;
  }
}

const CanvasContext = createContext({
  state: initialState,
  dispatch: () => {},
  openCanvas: () => {},
  openExistingCanvas: () => {},
  closeCanvas: () => {},
  appendContent: () => {},
  updateContent: () => {},
  markDone: () => {},
  resetCanvas: () => {},
});

export const useCanvas = () => useContext(CanvasContext);

export const CanvasProvider = ({ children }) => {
  const [state, dispatch] = useReducer(canvasReducer, initialState);

  const openCanvas = useCallback((payload) => {
    dispatch({ type: CanvasActions.OPEN, payload });
  }, []);

  const openExistingCanvas = useCallback((payload) => {
    dispatch({ type: CanvasActions.OPEN_EXISTING, payload });
  }, []);

  const closeCanvas = useCallback(() => {
    dispatch({ type: CanvasActions.CLOSE });
  }, []);

  const appendContent = useCallback((content) => {
    dispatch({ type: CanvasActions.APPEND_CONTENT, payload: content });
  }, []);

  const updateContent = useCallback((content) => {
    dispatch({ type: CanvasActions.UPDATE_CONTENT, payload: content });
  }, []);

  const markDone = useCallback(() => {
    dispatch({ type: CanvasActions.DONE });
  }, []);

  const resetCanvas = useCallback(() => {
    dispatch({ type: CanvasActions.RESET });
  }, []);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      openCanvas,
      openExistingCanvas,
      closeCanvas,
      appendContent,
      updateContent,
      markDone,
      resetCanvas,
    }),
    [
      state,
      openCanvas,
      openExistingCanvas,
      closeCanvas,
      appendContent,
      updateContent,
      markDone,
      resetCanvas,
    ]
  );

  return (
    <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>
  );
};
