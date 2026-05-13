package token

import "testing"

func TestSHA256IsDeterministicAndNotPlaintext(t *testing.T) {
	first := SHA256("refresh-token")
	second := SHA256("refresh-token")
	if first != second {
		t.Fatal("expected deterministic token hash")
	}
	if first == "refresh-token" {
		t.Fatal("token hash stored plaintext")
	}
}

func TestRandomURLProducesDifferentValues(t *testing.T) {
	first, err := RandomURL(32)
	if err != nil {
		t.Fatalf("RandomURL returned error: %v", err)
	}
	second, err := RandomURL(32)
	if err != nil {
		t.Fatalf("RandomURL returned error: %v", err)
	}
	if first == second {
		t.Fatal("expected random tokens to differ")
	}
	if len(first) < 40 || len(second) < 40 {
		t.Fatalf("tokens are shorter than expected: %q %q", first, second)
	}
}
