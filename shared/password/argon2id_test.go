package password

import "testing"

func TestHashWithParamsAndVerify(t *testing.T) {
	hash, err := HashWithParams("Correct$123", Params{Memory: 1024, Iterations: 1, Parallelism: 1, SaltLength: 16, KeyLength: 32})
	if err != nil {
		t.Fatalf("HashWithParams returned error: %v", err)
	}
	if hash == "Correct$123" {
		t.Fatal("password hash stored plaintext")
	}
	ok, err := Verify("Correct$123", hash)
	if err != nil {
		t.Fatalf("Verify returned error: %v", err)
	}
	if !ok {
		t.Fatal("expected password to verify")
	}
	ok, err = Verify("Wrong$123", hash)
	if err != nil {
		t.Fatalf("Verify wrong password returned error: %v", err)
	}
	if ok {
		t.Fatal("wrong password verified")
	}
}
