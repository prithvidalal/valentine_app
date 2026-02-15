import argparse
import json
import sys
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def serve() -> None:
  parser = argparse.ArgumentParser(description="Serve Valentine Love Quest locally")
  parser.add_argument("--port", type=int, default=8000)
  args = parser.parse_args()

  handler = SimpleHTTPRequestHandler
  server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)

  print(f"Serving at http://127.0.0.1:{args.port}")
  try:
    server.serve_forever()
  except KeyboardInterrupt:
    print("\nServer stopped.")


def check() -> None:
  errors = []
  file_path = ROOT / "data" / "trivia-questions.json"

  if not file_path.exists():
    errors.append("Missing data/trivia-questions.json")
  else:
    try:
      questions = json.loads(file_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
      errors.append(f"Invalid JSON: {exc}")
      questions = []

    if len(questions) != 5:
      errors.append(f"Expected exactly 5 questions, found {len(questions)}")

    for index, question in enumerate(questions, start=1):
      if "boxId" not in question:
        errors.append(f"Question {index} missing boxId")
      if len(question.get("choices", [])) != 4:
        errors.append(f"Question {index} must have 4 choices")

      correct_index = question.get("correctIndex")
      if not isinstance(correct_index, int) or correct_index < 0 or correct_index > 3:
        errors.append(f"Question {index} has invalid correctIndex")

  if errors:
    for error in errors:
      print(f"ERROR: {error}")
    raise SystemExit(1)

  print("All checks passed.")


def main() -> None:
  parser = argparse.ArgumentParser(prog="lovequest-tools")
  subparsers = parser.add_subparsers(dest="command", required=True)

  subparsers.add_parser("serve")
  subparsers.add_parser("check")

  args = parser.parse_args()

  if args.command == "serve":
    serve()
  elif args.command == "check":
    check()
  else:
    raise SystemExit(1)


if __name__ == "__main__":
  main()
