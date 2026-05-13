package password

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"

	"golang.org/x/crypto/argon2"
)

type Params struct {
	Memory      uint32
	Iterations  uint32
	Parallelism uint8
	SaltLength  uint32
	KeyLength   uint32
}

var DefaultParams = Params{
	Memory:      64 * 1024,
	Iterations:  3,
	Parallelism: 2,
	SaltLength:  16,
	KeyLength:   32,
}

func Hash(plain string) (string, error) {
	return HashWithParams(plain, ParamsFromEnv())
}

func ParamsFromEnv() Params {
	params := DefaultParams
	params.Memory = uint32(envInt("PASSWORD_HASH_MEMORY_KIB", int(params.Memory)))
	params.Iterations = uint32(envInt("PASSWORD_HASH_ITERATIONS", int(params.Iterations)))
	params.Parallelism = uint8(envInt("PASSWORD_HASH_PARALLELISM", int(params.Parallelism)))
	params.SaltLength = uint32(envInt("PASSWORD_HASH_SALT_BYTES", int(params.SaltLength)))
	params.KeyLength = uint32(envInt("PASSWORD_HASH_KEY_BYTES", int(params.KeyLength)))
	return params
}

func HashWithParams(plain string, params Params) (string, error) {
	salt := make([]byte, params.SaltLength)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	key := argon2.IDKey([]byte(plain), salt, params.Iterations, params.Memory, params.Parallelism, params.KeyLength)
	encodedSalt := base64.RawStdEncoding.EncodeToString(salt)
	encodedKey := base64.RawStdEncoding.EncodeToString(key)
	return fmt.Sprintf("$argon2id$v=19$m=%d,t=%d,p=%d$%s$%s", params.Memory, params.Iterations, params.Parallelism, encodedSalt, encodedKey), nil
}

func envInt(key string, fallback int) int {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return fallback
	}
	value, err := strconv.Atoi(raw)
	if err != nil || value <= 0 {
		return fallback
	}
	return value
}

func Verify(plain, encoded string) (bool, error) {
	params, salt, expected, err := decode(encoded)
	if err != nil {
		return false, err
	}
	actual := argon2.IDKey([]byte(plain), salt, params.Iterations, params.Memory, params.Parallelism, uint32(len(expected)))
	return subtle.ConstantTimeCompare(actual, expected) == 1, nil
}

func decode(encoded string) (Params, []byte, []byte, error) {
	parts := strings.Split(encoded, "$")
	if len(parts) != 6 || parts[1] != "argon2id" || parts[2] != "v=19" {
		return Params{}, nil, nil, errors.New("invalid argon2id hash")
	}
	var params Params
	for _, part := range strings.Split(parts[3], ",") {
		kv := strings.SplitN(part, "=", 2)
		if len(kv) != 2 {
			return Params{}, nil, nil, errors.New("invalid argon2id parameters")
		}
		value, err := strconv.Atoi(kv[1])
		if err != nil {
			return Params{}, nil, nil, err
		}
		switch kv[0] {
		case "m":
			params.Memory = uint32(value)
		case "t":
			params.Iterations = uint32(value)
		case "p":
			params.Parallelism = uint8(value)
		}
	}
	salt, err := base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil {
		return Params{}, nil, nil, err
	}
	key, err := base64.RawStdEncoding.DecodeString(parts[5])
	if err != nil {
		return Params{}, nil, nil, err
	}
	params.SaltLength = uint32(len(salt))
	params.KeyLength = uint32(len(key))
	return params, salt, key, nil
}
