import pytest
from scaffold import pascal, scaffold


def test_pascal():
    assert pascal("user-profile") == "UserProfile"
    assert pascal("cart") == "Cart"


def test_scaffold_creates_files(tmp_path):
    created = scaffold("user-profile", tmp_path)
    assert {p.name for p in created} == {"UserProfile.tsx", "UserProfile.test.tsx", "index.ts"}
    assert "export function UserProfile()" in (tmp_path / "user-profile" / "UserProfile.tsx").read_text()
    assert (tmp_path / "user-profile" / "index.ts").read_text() == "export * from './UserProfile';\n"


def test_refuses_to_overwrite(tmp_path):
    scaffold("cart", tmp_path)
    with pytest.raises(FileExistsError):
        scaffold("cart", tmp_path)


@pytest.mark.parametrize("bad", ["UserProfile", "../x", "a_b", "", "-a", "a--b", "1a"])
def test_rejects_invalid_names(tmp_path, bad):
    with pytest.raises(ValueError):
        scaffold(bad, tmp_path)
