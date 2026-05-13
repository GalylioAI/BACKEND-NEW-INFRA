package validate

import "testing"

func TestStrongPassword(t *testing.T) {
	if !StrongPassword("Valid$123") {
		t.Fatal("expected strong password to pass")
	}
	if StrongPassword("weakpass") {
		t.Fatal("expected weak password to fail")
	}
}

func TestNormalizePhone(t *testing.T) {
	got := NormalizePhone("12 345 678")
	if got != "+21612345678" {
		t.Fatalf("unexpected normalized phone: %s", got)
	}
}
